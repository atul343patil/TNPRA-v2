/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'primary': '#2196f3',
        'primary-light': '#64b5f6',
        'primary-dark': '#1976d2',
        'secondary': '#f50057',
        'secondary-light': '#ff4081',
        'secondary-dark': '#c51162',
        'background': '#1a1a1a',
        'paper': '#2d2d2d',
      },
    },
  },
  plugins: [],
  // Important to prevent conflicts with Material-UI
  corePlugins: {
    preflight: false,
  },
  // This allows Tailwind classes to work alongside MUI
  important: '#root',
}
