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
        ink: "#17212b",
        evergreen: "#1f5d50",
        coral: "#d96c4f",
        wheat: "#f5e9d7",
        mist: "#eef4f1"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 43, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
