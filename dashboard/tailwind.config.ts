import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff003c",
        background: "#0a0a0a",
        panel: "#0f0f1a",
        dim: "#1a1a2e",
        muted: "#444466",
        "text-main": "#e0e0e0",
        warning: "#ffaa00",
      },
      fontFamily: {
        mono: ["VT323", "monospace"],
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan-line 4s linear infinite",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
