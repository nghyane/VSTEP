import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"

export default defineConfig({
	plugins: [TanStackRouterVite({ quoteStyle: "double" }), react(), tailwindcss(), svgr()],
	resolve: {
		alias: { "#": resolve(import.meta.dirname, "src") },
	},
	server: { port: 5175, open: true },
})
