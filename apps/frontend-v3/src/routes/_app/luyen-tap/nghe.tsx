import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"

export const Route = createFileRoute("/_app/luyen-tap/nghe")({
	component: () => (
		<>
			<Header title="Nghe" />
			<div className="px-10 pb-12">
				<div className="card p-10 text-center">
					<img src="/mascot/lac-listen.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Sắp ra mắt</p>
				</div>
			</div>
		</>
	),
})
