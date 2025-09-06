/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--theme-bg)',
          hover: 'var(--theme-hover)',
          text: 'var(--theme-text)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          sidebar: 'var(--sidebar-bg)',
          window: 'var(--window-bg)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        hover: {
          bg: 'var(--hover-bg)',
        },
        sky: {
          100: 'var(--sky-100)',
          500: 'var(--sky-500)',
          600: 'var(--sky-600)',
        },
      },
    },
  },
  plugins: [],
}