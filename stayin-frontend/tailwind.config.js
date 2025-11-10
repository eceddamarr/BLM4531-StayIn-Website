import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: '#f43f5e',
        // primary: {
        //   50: '#fdf2f8',
        //   100: '#fce7f3',
        //   200: '#fbcfe8',
        //   300: '#f9a8d4',
        //   400: '#f472b6',
        //   500: '#f43f5e',
        //   600: '#e11d48',
        //   700: '#be185d',
        //   800: '#9d174d',
        //   900: '#831843',
        // },
      },
    },
  },
  plugins: [],
})
