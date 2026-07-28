import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // employee portal colors
        resto: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          orange: "#fc4100",
          gold: "#d97706",
          navy: "#00215e",
          slate: "#2c4e80",
        },
        // customer ui specific colors
        cust: {
          navy: "#13274F",     // dark blue sidebar
          gold: "#F3A150",     // yellow-gold accent/text
          dark: "#0F172A",     // dark panel background
          overlay: "rgba(0, 0, 0, 0.7)", // image overlay
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'], // classic fine dining font
      }
    },
  },
  plugins: [],
};

export default config;
