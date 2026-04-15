// Layout nền cho trang kết quả phòng thi.
// SVG background được inline trực tiếp dưới dạng JSX — tránh vấn đề MIME type
// khi file public/background không có extension .svg.

import type { ReactNode } from "react"

interface StarDef {
	top: string
	left?: string
	right?: string
	size: number
	opacity: number
}

const STARS: StarDef[] = [
	{ top: "8%", left: "5%", size: 14, opacity: 0.7 },
	{ top: "15%", left: "18%", size: 8, opacity: 0.5 },
	{ top: "6%", left: "55%", size: 10, opacity: 0.6 },
	{ top: "20%", right: "8%", size: 14, opacity: 0.8 },
	{ top: "35%", right: "3%", size: 8, opacity: 0.5 },
	{ top: "12%", right: "25%", size: 6, opacity: 0.4 },
	{ top: "42%", left: "2%", size: 8, opacity: 0.4 },
]

interface ResultPageLayoutProps {
	headerSlot: ReactNode
	children: ReactNode
}

export function ResultPageLayout({ headerSlot, children }: ResultPageLayoutProps) {
	return (
		<div className="relative flex min-h-screen flex-col items-center overflow-hidden">
			<BackgroundSvg />
			<StarDecorations />
			<div className="relative z-10 w-full">{headerSlot}</div>
			<div className="relative z-10 flex w-full flex-col items-center">{children}</div>
		</div>
	)
}

// SVG nguồn từ public/background — inline để tránh lỗi MIME type trên Vite dev server.
// Màu sắc (#0029FF, #1479F3, #47B7F7) là màu của design asset, không phải design token UI.
function BackgroundSvg() {
	return (
		<svg
			aria-hidden="true"
			role="presentation"
			className="pointer-events-none absolute inset-0 size-full"
			viewBox="0 0 1440 900"
			preserveAspectRatio="xMidYMid slice"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clipPath="url(#bg-clip0)">
				<rect width="1440" height="900" fill="url(#bg-grad)" />
				<g opacity="0.48">
					<g clipPath="url(#bg-clip1)">
						<circle cx="52.913" cy="803.96" r="185.198" fill="white" />
						<circle cx="209.624" cy="734.769" r="152.636" fill="white" />
						<circle cx="311.378" cy="850.769" r="101.757" fill="white" />
						<circle cx="428.4" cy="900.63" r="70.2125" fill="white" />
						<circle cx="124.144" cy="871.124" r="101.757" fill="white" />
					</g>
				</g>
				<g opacity="0.48">
					<g clipPath="url(#bg-clip2)">
						<circle cx="33.778" cy="838.549" r="118.212" fill="white" />
						<circle cx="133.798" cy="794.384" r="97.4271" fill="white" />
						<circle cx="198.756" cy="868.426" r="64.9514" fill="white" />
						<circle cx="273.445" cy="900.262" r="44.8165" fill="white" />
						<circle cx="79.2366" cy="881.422" r="64.9514" fill="white" />
					</g>
				</g>
				<g opacity="0.48">
					<g clipPath="url(#bg-clip3)">
						<circle
							cx="196.114"
							cy="196.114"
							r="196.114"
							transform="matrix(-1 0 0 1 1580.08 602.207)"
							fill="white"
						/>
						<circle
							cx="161.633"
							cy="161.633"
							r="161.633"
							transform="matrix(-1 0 0 1 1379.66 563.418)"
							fill="white"
						/>
						<circle
							cx="107.755"
							cy="107.755"
							r="107.755"
							transform="matrix(-1 0 0 1 1218.03 740.137)"
							fill="white"
						/>
						<circle
							cx="74.351"
							cy="74.351"
							r="74.351"
							transform="matrix(-1 0 0 1 1060.7 826.34)"
							fill="white"
						/>
						<circle
							cx="107.755"
							cy="107.755"
							r="107.755"
							transform="matrix(-1 0 0 1 1416.3 761.689)"
							fill="white"
						/>
						<circle cx="941" cy="730" r="10" fill="white" />
					</g>
				</g>
				<g opacity="0.48">
					<g clipPath="url(#bg-clip4)">
						<circle
							cx="125.179"
							cy="125.179"
							r="125.179"
							transform="matrix(-1 0 0 1 1529.41 709.768)"
							fill="white"
						/>
						<circle
							cx="103.17"
							cy="103.17"
							r="103.17"
							transform="matrix(-1 0 0 1 1401.49 685.012)"
							fill="white"
						/>
						<circle
							cx="68.7799"
							cy="68.7799"
							r="68.7799"
							transform="matrix(-1 0 0 1 1298.31 797.811)"
							fill="white"
						/>
						<circle
							cx="47.4581"
							cy="47.4581"
							r="47.4581"
							transform="matrix(-1 0 0 1 1197.9 852.84)"
							fill="white"
						/>
						<circle
							cx="68.7799"
							cy="68.7799"
							r="68.7799"
							transform="matrix(-1 0 0 1 1424.88 811.564)"
							fill="white"
						/>
					</g>
				</g>
			</g>
			<defs>
				<linearGradient
					id="bg-grad"
					x1="720"
					y1="0"
					x2="720"
					y2="900"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#0029FF" />
					<stop offset="0.35" stopColor="#1479F3" />
					<stop offset="1" stopColor="#47B7F7" />
				</linearGradient>
				<clipPath id="bg-clip0">
					<rect width="1440" height="900" fill="white" />
				</clipPath>
				<clipPath id="bg-clip1">
					<path d="M0 517H498.61V899.607H0V517Z" fill="white" />
				</clipPath>
				<clipPath id="bg-clip2">
					<path d="M0 655.389H318.262V899.606H0V655.389Z" fill="white" />
				</clipPath>
				<clipPath id="bg-clip3">
					<path d="M1440 494.449H912V899.608H1440V494.449Z" fill="white" />
				</clipPath>
				<clipPath id="bg-clip4">
					<path d="M1440 640.996H1102.98V899.608H1440V640.996Z" fill="white" />
				</clipPath>
			</defs>
		</svg>
	)
}

function StarDecorations() {
	return (
		<>
			{STARS.map((s, i) => (
				<svg
					key={i}
					role="presentation"
					aria-hidden="true"
					className="pointer-events-none absolute z-10"
					style={{ top: s.top, left: s.left, right: s.right, opacity: s.opacity }}
					width={s.size}
					height={s.size}
					viewBox="0 0 14 14"
					fill="none"
				>
					<path d="M7 0L8.5 5.5H14L9.5 8.5L11 14L7 11L3 14L4.5 8.5L0 5.5H5.5L7 0Z" fill="white" />
				</svg>
			))}
		</>
	)
}
