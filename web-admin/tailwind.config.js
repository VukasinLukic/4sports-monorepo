/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 4Sports Brand Colors
        primary: {
          DEFAULT: '#00E676',
          50: '#E0FFF4',
          100: '#B3FFE5',
          200: '#80FFD4',
          300: '#4DFFC3',
          400: '#26FFB6',
          500: '#00E676',
          600: '#00CC68',
          700: '#00B35C',
          800: '#009950',
          900: '#008043',
        },
        dark: {
          DEFAULT: '#121212',
          50: '#3D3D3D',
          100: '#2E2E2E',
          200: '#252525',
          300: '#1E1E1E',
          400: '#1A1A1A',
          500: '#121212',
          600: '#0D0D0D',
          700: '#080808',
          800: '#050505',
          900: '#000000',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
