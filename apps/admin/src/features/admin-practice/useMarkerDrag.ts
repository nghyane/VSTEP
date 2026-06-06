import type React from "react"
import { useState } from "react"
import type { AdminWritingMarker } from "#/features/admin-practice/types"

export function useMarkerDrag(
	leftMarkers: AdminWritingMarker[],
	rightMarkers: AdminWritingMarker[],
	onReorder?: (updated: AdminWritingMarker[]) => void,
) {
	const [dragId, setDragId] = useState<string | null>(null)
	const [dragOverId, setDragOverId] = useState<string | null>(null)

	function clearDrag() {
		setDragId(null)
		setDragOverId(null)
	}

	function handleDragStart(e: React.DragEvent, id: string) {
		setDragId(id)
		e.dataTransfer.effectAllowed = "move"
	}

	function handleDragOver(e: React.DragEvent, id: string) {
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"
		setDragOverId(id)
	}

	function applyDrop(targetId: string | null, targetSide: "left" | "right") {
		if (!dragId || dragId === targetId) {
			clearDrag()
			return
		}
		const dragSide = leftMarkers.find((m) => m.id === dragId) ? "left" : "right"
		const fromList = dragSide === "left" ? leftMarkers : rightMarkers
		const toList = targetSide === "left" ? leftMarkers : rightMarkers
		const dragMarker = fromList.find((m) => m.id === dragId)
		if (!dragMarker) {
			clearDrag()
			return
		}

		if (dragSide === targetSide) {
			if (targetId === null) {
				clearDrag()
				return
			}
			const reordered = [...fromList]
			const fromIdx = reordered.findIndex((m) => m.id === dragId)
			const toIdx = reordered.findIndex((m) => m.id === targetId)
			const [item] = reordered.splice(fromIdx, 1)
			reordered.splice(toIdx, 0, item)
			onReorder?.(reordered.map((m, i) => ({ ...m, display_order: i + 1 })))
		} else {
			const newFrom = fromList.filter((m) => m.id !== dragId).map((m, i) => ({ ...m, display_order: i + 1 }))
			const inserted = [...toList]
			const toIdx = targetId ? inserted.findIndex((m) => m.id === targetId) : inserted.length
			inserted.splice(toIdx === -1 ? inserted.length : toIdx, 0, { ...dragMarker, side: targetSide })
			onReorder?.([...newFrom, ...inserted.map((m, i) => ({ ...m, display_order: i + 1 }))])
		}
		clearDrag()
	}

	function handleDrop(e: React.DragEvent, targetId: string, side: "left" | "right") {
		e.preventDefault()
		applyDrop(targetId, side)
	}

	function handleColumnDrop(e: React.DragEvent, side: "left" | "right") {
		e.preventDefault()
		applyDrop(null, side)
	}

	return {
		dragId,
		dragOverId,
		handleDragStart,
		handleDragOver,
		handleDrop,
		handleColumnDrop,
		handleDragEnd: clearDrag,
	}
}
