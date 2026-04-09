-- ============================================================
-- Migration: Collaborative Folder Sharing
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create folder_members table
CREATE TABLE folder_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id  UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(folder_id, user_id)
);

-- 2. Create folder_invites table
CREATE TABLE folder_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id  UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  max_uses   INT DEFAULT NULL,
  use_count  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add created_by_name column to memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 4. Auto-insert owner into folder_members when a folder is created
CREATE OR REPLACE FUNCTION auto_add_folder_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO folder_members (folder_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_folder_owner
  AFTER INSERT ON folders
  FOR EACH ROW EXECUTE FUNCTION auto_add_folder_owner();

-- 5. Backfill existing folders with owner membership
INSERT INTO folder_members (folder_id, user_id, role)
SELECT id, user_id, 'owner' FROM folders
ON CONFLICT DO NOTHING;

-- 6. RPC: accept_invite (atomic invite acceptance)
CREATE OR REPLACE FUNCTION accept_invite(invite_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite folder_invites%ROWTYPE;
  v_folder folders%ROWTYPE;
  v_existing folder_members%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- Find the invite
  SELECT * INTO v_invite FROM folder_invites WHERE token = invite_token;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'INVALID_TOKEN');
  END IF;

  -- Check expiry
  IF v_invite.expires_at < now() THEN
    RETURN json_build_object('error', 'EXPIRED');
  END IF;

  -- Check max uses
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RETURN json_build_object('error', 'MAX_USES_REACHED');
  END IF;

  -- Check if already a member
  SELECT * INTO v_existing FROM folder_members
    WHERE folder_id = v_invite.folder_id AND user_id = v_user_id;
  IF FOUND THEN
    RETURN json_build_object('error', 'ALREADY_MEMBER', 'folder_id', v_invite.folder_id);
  END IF;

  -- Insert membership
  INSERT INTO folder_members (folder_id, user_id, role)
    VALUES (v_invite.folder_id, v_user_id, 'collaborator');

  -- Increment use count
  UPDATE folder_invites SET use_count = use_count + 1 WHERE id = v_invite.id;

  -- Return folder info
  SELECT * INTO v_folder FROM folders WHERE id = v_invite.folder_id;
  RETURN json_build_object(
    'success', true,
    'folder_id', v_folder.id,
    'folder_name', v_folder.name
  );
END;
$$;

-- ============================================================
-- 7. RLS Policies
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE folder_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on folders and memories (adjust names if different)
-- You may need to check your existing policy names in Supabase dashboard
-- DROP POLICY IF EXISTS "existing_policy_name" ON folders;
-- DROP POLICY IF EXISTS "existing_policy_name" ON memories;

-- --- folders ---
CREATE POLICY "folders_select" ON folders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_members.folder_id = folders.id
      AND folder_members.user_id = auth.uid()
  )
);

CREATE POLICY "folders_insert" ON folders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "folders_update" ON folders FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "folders_delete" ON folders FOR DELETE USING (
  user_id = auth.uid()
);

-- --- memories ---
CREATE POLICY "memories_select" ON memories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_members.folder_id = memories.folder_id
      AND folder_members.user_id = auth.uid()
  )
);

CREATE POLICY "memories_insert" ON memories FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_members.folder_id = memories.folder_id
      AND folder_members.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

CREATE POLICY "memories_update" ON memories FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "memories_delete" ON memories FOR DELETE USING (
  user_id = auth.uid()
);

-- --- folder_members ---
CREATE POLICY "folder_members_select" ON folder_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM folder_members AS fm
    WHERE fm.folder_id = folder_members.folder_id
      AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "folder_members_insert" ON folder_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "folder_members_delete" ON folder_members FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM folder_members AS fm
    WHERE fm.folder_id = folder_members.folder_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'owner'
  )
);

-- --- folder_invites ---
CREATE POLICY "folder_invites_select" ON folder_invites FOR SELECT USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "folder_invites_insert" ON folder_invites FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_members.folder_id = folder_invites.folder_id
      AND folder_members.user_id = auth.uid()
      AND folder_members.role = 'owner'
  )
);

CREATE POLICY "folder_invites_update" ON folder_invites FOR UPDATE USING (
  created_by = auth.uid()
);

CREATE POLICY "folder_invites_delete" ON folder_invites FOR DELETE USING (
  created_by = auth.uid()
);
