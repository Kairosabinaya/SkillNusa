/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#010042',
          light: '#1a1a5a',
          dark: '#00002e',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}