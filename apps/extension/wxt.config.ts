import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: "Sora Type",
    description: "Identify and inspect fonts on any web page.",
    permissions: ["storage", ...(browser === "chrome" ? ["sidePanel"] : [])],
    // Chrome/Edge only for now — Firefox uses sidebar_action, which needs
    // its own entrypoint and manifest shape; add when the extension
    // supports Firefox.
    ...(browser === "chrome" && {
      side_panel: { default_path: "sidepanel.html" },
    }),
    commands: {
      "toggle-picker": {
        suggested_key: { default: "Alt+Shift+F" },
        description: "Toggle the font picker",
      },
    },
  }),
});
