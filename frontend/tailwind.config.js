/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2D3B55",
          light: "#3D4F6E",
          dark: "#1E2A3D",
        },
        accent: {
          DEFAULT: "#22C55E",
          light: "#4ADE80",
          dark: "#16A34A",
        },
        background: "#F8FAFC",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}