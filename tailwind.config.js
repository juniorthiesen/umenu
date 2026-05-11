/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app.tsx"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-primary)",
          soft: "var(--color-primary-soft)",
          strong: "var(--color-primary-strong)"
        },
        accent: "var(--color-accent)",
        surface: "var(--color-surface)"
      },
      fontFamily: {
        display: ["var(--font-display)"]
      }
    }
  },
  plugins: []
}
