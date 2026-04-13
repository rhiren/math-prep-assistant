import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f2e8",
        ink: "#182027",
        accent: "#005f73",
        warm: "#e9d8a6",
        panel: "#fffdf8",
      },
    },
  },
  plugins: [],
} satisfies Config;
