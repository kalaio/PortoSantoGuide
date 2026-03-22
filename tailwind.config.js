/* eslint-disable @typescript-eslint/no-require-imports */
const { heroui } = require("@heroui/theme/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {}
  },
  plugins: [heroui()]
};
