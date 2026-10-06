// Rebuild styles.css after editing index.html:
//   npx tailwindcss@3 -c tailwind.config.js -i tailwind.input.css -o styles.css --minify
module.exports = {
  content: ['./index.html'],
  theme: { extend: {} },
  plugins: [],
};
