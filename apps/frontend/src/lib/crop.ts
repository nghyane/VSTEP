interface CropArea {
	x: number
	y: number
	width: number
	height: number
}

export async function getCroppedBlob(imageSrc: string, cropArea: CropArea): Promise<Blob> {
	const image = await loadImage(imageSrc)
	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error("Canvas 2D context not available")

	canvas.width = cropArea.width
	canvas.height = cropArea.height

	ctx.drawImage(
		image,
		cropArea.x,
		cropArea.y,
		cropArea.width,
		cropArea.height,
		0,
		0,
		cropArea.width,
		cropArea.height,
	)

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob)
				else reject(new Error("Canvas toBlob failed"))
			},
			"image/jpeg",
			0.9,
		)
	})
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = "anonymous"
		img.onload = () => resolve(img)
		img.onerror = reject
		img.src = src
	})
}
