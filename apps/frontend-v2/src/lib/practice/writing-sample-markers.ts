// writing-sample-markers.ts
//
// Util để chuyển SampleMarkerDef (match-string) → ResolvedMarker (có range thật).
//
// Lý do dùng match-string thay offset:
//   - Admin nhập bằng cách bôi đen text trong UI, không nhập số.
//   - Offset thay đổi mỗi khi sampleAnswer bị sửa; match-string thì không.
//   - Backend validate: match phải tồn tại trong sampleAnswer khi save.
//
// Backend contract: Question.content.sampleMarkers[] — xem SampleMarkerDef trong writing.ts.

import type { SampleMarkerDef } from "#/lib/mock/writing"

/** Marker đã resolve ra position thật để render. */
export interface ResolvedMarker extends SampleMarkerDef {
	range: { start: number; end: number }
}

/**
 * Tìm vị trí của match trong text, lấy lần thứ `occurrence` (1-based).
 * Trả null nếu không tìm thấy — caller bỏ qua marker đó (graceful degrade).
 */
export function matchToRange(
	text: string,
	match: string,
	occurrence = 1,
): { start: number; end: number } | null {
	if (!match || occurrence < 1) return null
	let count = 0
	let pos = 0
	while (pos <= text.length) {
		const idx = text.indexOf(match, pos)
		if (idx === -1) return null
		count++
		if (count === occurrence) return { start: idx, end: idx + match.length }
		pos = idx + 1
	}
	return null
}

/**
 * Chuyển danh sách SampleMarkerDef thành ResolvedMarker[] có range thật.
 * Marker nào không tìm thấy match thì bị bỏ (log warning trong dev).
 */
export function resolveMarkers(
	sampleAnswer: string,
	defs: readonly SampleMarkerDef[] | undefined,
): ResolvedMarker[] {
	if (!defs?.length) return []
	const result: ResolvedMarker[] = []
	for (const def of defs) {
		const range = matchToRange(sampleAnswer, def.match, def.occurrence ?? 1)
		if (!range) {
			// Match không tìm thấy — có thể sampleAnswer đã bị sửa.
			// Backend sẽ validate và báo lỗi khi admin save.
			if (process.env.NODE_ENV !== "production") {
				console.warn(
					`[SampleMarker] match không tìm thấy: "${def.match}" (id=${def.id})`,
				)
			}
			continue
		}
		// Kiểm tra overlap với marker đã có
		const overlaps = result.some((r) => r.range.start < range.end && r.range.end > range.start)
		if (overlaps) {
			if (process.env.NODE_ENV !== "production") {
				console.warn(`[SampleMarker] overlap: "${def.match}" (id=${def.id}) — bỏ qua`)
			}
			continue
		}
		result.push({ ...def, range })
	}
	return result
}
