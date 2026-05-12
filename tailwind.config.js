/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "reveal-word": {
          "0%":   { transform: "translateY(110%) rotate(3deg)", opacity: "0" },
          "100%": { transform: "translateY(0%) rotate(0deg)",   opacity: "1" },
        },
      },
      animation: {
        "reveal-word": "reveal-word 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
