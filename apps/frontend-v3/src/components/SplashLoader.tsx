import { StaticIcon, type StaticIconName } from "#/components/Icon"
import { Logo } from "#/components/Logo"

const ORBITERS: { icon: StaticIconName; top: string; left: string; delay: string }[] = [
	{ icon: "trophy", top: "8%", left: "18%", delay: "0ms" },
	{ icon: "coin", top: "16%", left: "78%", delay: "400ms" },
	{ icon: "streak-sm", top: "72%", left: "12%", delay: "800ms" },
]

export function SplashLoader() {
	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
			<div className="relative flex size-64 items-center justify-center">
				{ORBITERS.map((o) => (
					<span
						key={o.icon}
						aria-hidden
						className="absolute opacity-40"
						style={{
							top: o.top,
							left: o.left,
							animation: `float 2400ms ease-in-out ${o.delay} infinite`,
						}}
					>
						<StaticIcon name={o.icon} size="sm" />
					</span>
				))}
				<img
					src="/mascot/lac-wave.png"
					alt=""
					className="relative h-44 w-auto animate-[mascotBob_1400ms_ease-in-out_infinite]"
				/>
			</div>
			<div className="flex flex-col items-center gap-3">
				<Logo size="lg" />
				<div className="flex items-center gap-1.5">
					{[0, 200, 400].map((delay) => (
						<span
							key={delay}
							className="size-2 rounded-full bg-primary"
							style={{ animation: `dotBounce 900ms ease-in-out ${delay}ms infinite` }}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
