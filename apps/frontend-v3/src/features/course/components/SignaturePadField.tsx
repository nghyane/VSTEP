import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react"
import SignaturePad from "signature_pad"

export interface SignaturePadFieldRef {
	getSvg: () => string | null
	clear: () => void
	isEmpty: () => boolean
}

interface Props {
	ref?: Ref<SignaturePadFieldRef>
	disabled?: boolean
	onChange?: (isEmpty: boolean) => void
}

export function SignaturePadField({ ref, disabled, onChange }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const padRef = useRef<SignaturePad | null>(null)
	const [empty, setEmpty] = useState(true)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const canvasEl: HTMLCanvasElement = canvas

		const pad = new SignaturePad(canvasEl, {
			penColor: "#1f1f1f",
			backgroundColor: "rgba(0,0,0,0)",
			minWidth: 1.2,
			maxWidth: 2.6,
			throttle: 16,
		})
		padRef.current = pad

		function resize(): void {
			const ratio = Math.max(window.devicePixelRatio || 1, 1)
			const data = pad.toData()
			canvasEl.width = canvasEl.offsetWidth * ratio
			canvasEl.height = canvasEl.offsetHeight * ratio
			canvasEl.getContext("2d")?.scale(ratio, ratio)
			pad.clear()
			if (data.length > 0) pad.fromData(data)
		}
		resize()
		window.addEventListener("resize", resize)

		const handleEnd = () => {
			const isEmpty = pad.isEmpty()
			setEmpty(isEmpty)
			onChange?.(isEmpty)
		}
		pad.addEventListener("endStroke", handleEnd)

		return () => {
			window.removeEventListener("resize", resize)
			pad.removeEventListener("endStroke", handleEnd)
			pad.off()
		}
	}, [onChange])

	useEffect(() => {
		if (!padRef.current) return
		if (disabled) padRef.current.off()
		else padRef.current.on()
	}, [disabled])

	useImperativeHandle(
		ref,
		() => ({
			getSvg: () => (padRef.current?.isEmpty() ? null : (padRef.current?.toSVG() ?? null)),
			clear: () => {
				padRef.current?.clear()
				setEmpty(true)
				onChange?.(true)
			},
			isEmpty: () => padRef.current?.isEmpty() ?? true,
		}),
		[onChange],
	)

	return (
		<div className="space-y-2">
			<div className="relative overflow-hidden rounded-(--radius-card) border-2 border-b-4 border-warning/40 bg-card">
				<canvas
					ref={canvasRef}
					className="block h-36 w-full touch-none"
					style={{ touchAction: "none" }}
					aria-label="Ô ký tên xác nhận cam kết"
				/>
				{empty && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span className="text-xs font-extrabold uppercase tracking-[0.18em] text-warning/70">
							Ký tên của bạn vào đây
						</span>
					</div>
				)}
				<div className="pointer-events-none absolute inset-x-6 bottom-3 border-b-2 border-dashed border-warning/30" />
			</div>
			<div className="flex items-center justify-between text-xs">
				<span className="text-muted">
					{empty ? "Dùng ngón tay hoặc chuột để ký." : "Đã ký, bạn có thể tiếp tục."}
				</span>
				<button
					type="button"
					onClick={() => {
						padRef.current?.clear()
						setEmpty(true)
						onChange?.(true)
					}}
					disabled={disabled || empty}
					className="rounded-(--radius-button) px-2 py-1 text-xs font-extrabold text-warning underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
				>
					Vẽ lại
				</button>
			</div>
		</div>
	)
}
