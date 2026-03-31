/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Muted, professional palette */
        primary: { 50: "#f0f4ff", 100: "#dbe4ff", 200: "#bac8ff", 300: "#91a7ff", 400: "#748ffc", 500: "#5c7cfa", 600: "#4c6ef5", 700: "#4263eb", 800: "#3b5bdb", 900: "#364fc7" },
        surface: { light: "#f8f9fa", dark: "#1a1b1e" },
        muted: { light: "#868e96", dark: "#909296" },
      },
    },
  },
  plugins: [],
};
