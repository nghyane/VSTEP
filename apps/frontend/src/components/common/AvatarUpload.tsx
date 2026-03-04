import { Camera02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useRef, useState } from "react"
import type { Area } from "react-easy-crop"
import Cropper from "react-easy-crop"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { avatarUrl, getInitials } from "@/lib/avatar"
import { getCroppedBlob } from "@/lib/crop"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif"
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

interface AvatarUploadProps {
	avatarKey: string | null | undefined
	fullName: string | null | undefined
	email?: string | null
	isPending?: boolean
	onUpload: (blob: Blob) => void
	className?: string
}

export function AvatarUpload({
	avatarKey,
	fullName,
	email,
	isPending,
	onUpload,
	className,
}: AvatarUploadProps) {
	const [open, setOpen] = useState(false)
	const [imageSrc, setImageSrc] = useState<string | null>(null)
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedArea, setCroppedArea] = useState<Area | null>(null)
	const [error, setError] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	const initials = getInitials(fullName, email)

	const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
		setCroppedArea(croppedAreaPixels)
	}, [])

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		setError("")

		if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
			setError("Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF")
			return
		}

		if (file.size > MAX_SIZE) {
			setError("Ảnh không được vượt quá 5MB")
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			setImageSrc(reader.result as string)
			setCrop({ x: 0, y: 0 })
			setZoom(1)
		}
		reader.readAsDataURL(file)
	}

	async function handleConfirm() {
		if (!imageSrc || !croppedArea) return

		try {
			const blob = await getCroppedBlob(imageSrc, croppedArea)
			onUpload(blob)
			handleClose()
		} catch {
			setError("Không thể xử lý ảnh, vui lòng thử lại")
		}
	}

	function handleClose() {
		setOpen(false)
		setImageSrc(null)
		setCrop({ x: 0, y: 0 })
		setZoom(1)
		setCroppedArea(null)
		setError("")
		if (inputRef.current) inputRef.current.value = ""
	}

	return (
		<>
			<button
				type="button"
				className={cn("group relative cursor-pointer rounded-full", className)}
				onClick={() => setOpen(true)}
			>
				<Avatar className={cn("size-full")}>
					<AvatarImage src={avatarUrl(avatarKey, fullName)} alt={fullName ?? "Avatar"} />
					<AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
					<HugeiconsIcon icon={Camera02Icon} className="size-6 text-white" />
				</div>
			</button>

			<Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
						<DialogDescription>
							Chọn ảnh và điều chỉnh vùng cắt. Hỗ trợ JPEG, PNG, WebP, GIF (tối đa 5MB).
						</DialogDescription>
					</DialogHeader>

					{!imageSrc ? (
						<label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 py-12 transition-colors hover:border-primary/50 hover:bg-muted/50">
							<HugeiconsIcon icon={Camera02Icon} className="size-10 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Nhấn để chọn ảnh</span>
							<input
								ref={inputRef}
								type="file"
								accept={ACCEPTED_TYPES}
								className="hidden"
								onChange={handleFileSelect}
							/>
						</label>
					) : (
						<div className="space-y-4">
							<div className="relative h-64 w-full overflow-hidden rounded-xl bg-muted">
								<Cropper
									image={imageSrc}
									crop={crop}
									zoom={zoom}
									aspect={1}
									cropShape="round"
									showGrid={false}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onCropComplete={onCropComplete}
								/>
							</div>
							<div className="flex items-center gap-3 px-1">
								<span className="text-xs text-muted-foreground">Thu nhỏ</span>
								<input
									type="range"
									min={1}
									max={3}
									step={0.1}
									value={zoom}
									onChange={(e) => setZoom(Number(e.target.value))}
									className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
								/>
								<span className="text-xs text-muted-foreground">Phóng to</span>
							</div>
						</div>
					)}

					{error && <p className="text-sm text-destructive">{error}</p>}

					<DialogFooter>
						{imageSrc && (
							<Button
								variant="outline"
								onClick={() => {
									setImageSrc(null)
									if (inputRef.current) inputRef.current.value = ""
								}}
							>
								Chọn ảnh khác
							</Button>
						)}
						<Button onClick={handleConfirm} disabled={!imageSrc || !croppedArea || isPending}>
							{isPending ? "Đang tải lên..." : "Lưu ảnh đại diện"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
