-- ============================================================
-- Fix: RLS recursion on folder_members + get_folder_members RPC
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the recursive policy and replace with a simple one
DROP POLICY IF EXISTS "folder_members_select" ON folder_members;

-- Simple: each user can only see their own membership rows via loadData.
-- To view all members of a folder (for ShareFolderModal), we use a
-- security definer RPC below that bypasses RLS safely.
CREATE POLICY "folder_members_select" ON folder_members FOR SELECT USING (
  user_id = auth.uid()
);

-- 2. RPC: get_folder_members — returns all members of a folder if caller is a member
CREATE OR REPLACE FUNCTION get_folder_members(p_folder_id UUID)
RETURNS TABLE (
  id         UUID,
  folder_id  UUID,
  user_id    UUID,
  user_name  TEXT,
  role       TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only let members of the folder call this
  IF NOT EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_members.folder_id = p_folder_id
      AND folder_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this folder';
  END IF;

  RETURN QUERY
    SELECT
      fm.id,
      fm.folder_id,
      fm.user_id,
      COALESCE(p.name, 'Unknown') AS user_name,
      fm.role,
      fm.created_at
    FROM folder_members fm
    LEFT JOIN profiles p ON p.id = fm.user_id
    WHERE fm.folder_id = p_folder_id
    ORDER BY fm.created_at;
END;
$$;

-- 3. RPC: get_or_create_invite — reuse existing valid invite or create new one
CREATE OR REPLACE FUNCTION get_or_create_invite(p_folder_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invite  folder_invites%ROWTYPE;
BEGIN
  -- Must be owner to create/get invites
  IF NOT EXISTS (
    SELECT 1 FROM folder_members
    WHERE folder_id = p_folder_id
      AND user_id = v_user_id
      AND role = 'owner'
  ) THEN
    RETURN json_build_object('error', 'NOT_OWNER');
  END IF;

  -- Try to reuse an existing non-expired invite created by this user
  SELECT * INTO v_invite
  FROM folder_invites
  WHERE folder_id = p_folder_id
    AND created_by = v_user_id
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If none found, create a new one
  IF NOT FOUND THEN
    INSERT INTO folder_invites (folder_id, created_by)
    VALUES (p_folder_id, v_user_id)
    RETURNING * INTO v_invite;
  END IF;

  RETURN json_build_object(
    'id',         v_invite.id,
    'folder_id',  v_invite.folder_id,
    'token',      v_invite.token,
    'expires_at', v_invite.expires_at,
    'max_uses',   v_invite.max_uses,
    'use_count',  v_invite.use_count,
    'created_at', v_invite.created_at
  );
END;
$$;
