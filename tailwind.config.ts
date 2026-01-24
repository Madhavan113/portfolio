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
        cream: "#FFFFFF",
        charcoal: "#000000",
        gold: "#666666",
      },
      fontFamily: {
        mono: ['"Courier Prime"', "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

