/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode (default)
        bg: "#0d130f",
        bg2: "#080c09",
        surface: "#121b16",
        stroke: "#1b241d",
        text: "#f4f7f3",
        textDim: "#9aa89f",
        textFaint: "#5f6d64",
        green: "#3fe07e",
        greenLt: "#a8ff9e",
        greenDeep: "#0f3a24",
        amber: "#ffcf6b",
        coral: "#ff7a6b",
        lime: "#bdff80",
        cardBg: "#131f18",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl2: "28px",
      },
    },
  },
  plugins: [],
};
