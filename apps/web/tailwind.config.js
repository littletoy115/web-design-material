/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // unbleached cotton, cool
        cotton: '#F2F3F0',
        // deep indigo used for text
        ink: '#1C2438',
        // hom indigo, the single accent
        hom: {
          DEFAULT: '#2D4B80',
          dark: '#223A64',
        },
        // faded indigo for lines and quiet surfaces
        faded: '#9AAAC4',
        // gold thread detail, use sparingly
        thread: '#A88B4A',
      },
      fontFamily: {
        display: ['"Bai Jamjuree"', 'sans-serif'],
        sans: ['Anuphan', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
