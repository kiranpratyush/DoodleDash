import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: "Doodle dash free drawing and guessing game",
    favicon: "./public/icon.png"
  },
  server:{
    port:4000
  }
});
