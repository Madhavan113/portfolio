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
        cream: "#f6f4ee",
        charcoal: "#111111",
        gold: "#5f5f5f",
      },
      fontFamily: {
        mono: ['"Courier Prime"', "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

