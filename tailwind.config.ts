import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        charcoal: "#2D2A26",
        gold: "#8B7355",
      },
      fontFamily: {
        mono: ['"Courier Prime"', "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

