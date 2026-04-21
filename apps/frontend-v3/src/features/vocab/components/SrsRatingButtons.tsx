import type { SrsRating } from "#/features/vocab/types"

interface Props {
	disabled: boolean
	onRate: (rating: SrsRating) => void
}

export function SrsRatingButtons({ disabled, onRate }: Props) {
	return (
		<div className="grid grid-cols-4 gap-2 mt-4">
			<button type="button" disabled={disabled} onClick={() => onRate(1)}
				className="bg-destructive-tint text-destructive py-3 rounded-(--radius-button) font-bold text-sm transition disabled:opacity-50">
				Quên
			</button>
			<button type="button" disabled={disabled} onClick={() => onRate(2)}
				className="bg-warning-tint text-warning py-3 rounded-(--radius-button) font-bold text-sm transition disabled:opacity-50">
				Khó
			</button>
			<button type="button" disabled={disabled} onClick={() => onRate(3)}
				className="bg-primary-tint text-primary py-3 rounded-(--radius-button) font-bold text-sm transition disabled:opacity-50">
				Nhớ
			</button>
			<button type="button" disabled={disabled} onClick={() => onRate(4)}
				className="bg-info-tint text-info py-3 rounded-(--radius-button) font-bold text-sm transition disabled:opacity-50">
				Dễ
			</button>
		</div>
	)
}
