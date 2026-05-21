import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ash: "#101010",
        ember: "#8f1d21",
        crimson: "#c42a31",
        parchment: "#eadcc3",
        oldgold: "#c79a42",
        smoke: "#a7a099"
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-inter)", "sans-serif"]
      },
      boxShadow: {
        ember: "0 0 42px rgba(196, 42, 49, 0.32)",
        gold: "0 0 26px rgba(199, 154, 66, 0.28)"
      },
      backgroundImage: {
        "radial-crimson": "radial-gradient(circle at 50% 15%, rgba(196,42,49,.28), transparent 38%)"
      }
    }
  },
  plugins: []
};

export default config;
