import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // Add plugins back
  server: {
    host: "localhost",
    port: 5173,
  },
});