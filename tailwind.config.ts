import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#0A0F1A",
          1: "#121826",
          2: "#1A2233",
        },
        accent: {
          blue: "#0891B2",
          cyan: "#06B6D4",
        },
        layer: {
          active: "#0EA5E9",
          locked: "#475569",
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Consolas"', "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
