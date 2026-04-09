/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        notion: {
          gray: '#9B9A97',
          brown: '#64473A',
          orange: '#D9730D',
          yellow: '#CB912F',
          green: '#448361',
          blue: '#337EA9',
          purple: '#9065B0',
          pink: '#C14C8A',
          red: '#D44C47',
        },
      },
    },
  },
  plugins: [],
}
