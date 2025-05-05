/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Path to all React components
    "./public/index.html", // Add if using HTML files
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors here
        primary: "#3b82f6", // Example blue
        danger: "#ef4444", // Example red
      },
    },
  },
  plugins: [],
};
