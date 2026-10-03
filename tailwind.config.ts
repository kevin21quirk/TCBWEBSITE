import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#dc2626",
          dark: "#b91c1c",
          light: "#ef4444",
        },
        ink: "#111827",
        muted: "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      borderRadius: {
        tcb: "20px",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
