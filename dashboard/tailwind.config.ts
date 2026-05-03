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
        primary: "#376374",
        background: "#1A282F",
        panel: "#161616",
        dim: "#262626",
        muted: "#404040",
        "text-main": "#AFAB9C",
        accent: "#836A46",
      },
      fontFamily: {
        sans: ["Lexend", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "glitch-flicker": "glitch 0.2s ease infinite",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { opacity: "1", transform: "translate(0)" },
          "20%": { opacity: "0.8", transform: "translate(-2px, 1px)" },
          "40%": { opacity: "1", transform: "translate(2px, -1px)" },
          "60%": { opacity: "0.9", transform: "translate(-1px, -2px)" },
          "80%": { opacity: "1", transform: "translate(1px, 2px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
