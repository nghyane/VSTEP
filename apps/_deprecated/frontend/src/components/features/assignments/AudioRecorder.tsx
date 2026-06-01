import { Mic01Icon, StopIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface AudioRecorderProps {
	onRecorded: (blob: Blob) => void
	disabled?: boolean
}

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
	const [recording, setRecording] = useState(false)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)
	const [duration, setDuration] = useState(0)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const recorder = new MediaRecorder(stream)
			mediaRecorderRef.current = recorder
			chunksRef.current = []

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}

			recorder.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: "audio/webm" })
				const url = URL.createObjectURL(blob)
				setAudioUrl(url)
				onRecorded(blob)
				for (const t of stream.getTracks()) t.stop()
			}

			recorder.start()
			setRecording(true)
			setDuration(0)
			setAudioUrl(null)
			timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
		} catch {
			toast.error("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.")
		}
	}, [onRecorded])

	const stopRecording = useCallback(() => {
		mediaRecorderRef.current?.stop()
		setRecording(false)
		if (timerRef.current) clearInterval(timerRef.current)
	}, [])

	function formatTime(secs: number): string {
		const m = Math.floor(secs / 60)
		const s = secs % 60
		return `${m}:${s.toString().padStart(2, "0")}`
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				{recording ? (
					<>
						<Button
							type="button"
							size="sm"
							variant="destructive"
							className="gap-1.5"
							onClick={stopRecording}
						>
							<HugeiconsIcon icon={StopIcon} className="size-3.5" />
							Dừng ghi âm
						</Button>
						<span className="animate-pulse text-sm font-medium text-red-500">
							● {formatTime(duration)}
						</span>
					</>
				) : (
					<Button
						type="button"
						size="sm"
						className="gap-1.5"
						onClick={startRecording}
						disabled={disabled}
					>
						<HugeiconsIcon icon={Mic01Icon} className="size-3.5" />
						{audioUrl ? "Ghi lại" : "Bắt đầu ghi âm"}
					</Button>
				)}
			</div>

			{audioUrl && (
				<div className="rounded-lg bg-muted/50 p-3">
					<p className="mb-2 text-xs text-muted-foreground">Bản ghi của bạn:</p>
					<audio controls className="w-full" src={audioUrl}>
						<track kind="captions" />
					</audio>
				</div>
			)}
		</div>
	)
}
