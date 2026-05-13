import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#000047",
        cyan: "#00cccc",
        mint: "#9acec7"
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Kanit", "sans-serif"],
        body: ["var(--font-body)", "Ubuntu", "sans-serif"]
      },
      boxShadow: {
        panel: "0 12px 30px rgba(0, 0, 71, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
