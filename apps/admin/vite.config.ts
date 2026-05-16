import { resolve } from "node:path"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [TanStackRouterVite({ quoteStyle: "double" }), react()],
	resolve: {
		alias: { "#": resolve(import.meta.dirname, "src") },
	},
	server: {
		port: 5180,
		open: true,
	},
})
