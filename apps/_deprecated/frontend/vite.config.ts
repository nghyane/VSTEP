import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const config = defineConfig({
	plugins: [
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact(),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules/recharts")) return "recharts-vendor"
					if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
						return "motion-vendor"
					}
					if (id.includes("node_modules/react-markdown") || id.includes("node_modules/remark-gfm")) {
						return "markdown-vendor"
					}
					if (id.includes("node_modules/react-media-recorder")) {
						return "media-vendor"
					}
				},
			},
		},
	},
})

export default config
