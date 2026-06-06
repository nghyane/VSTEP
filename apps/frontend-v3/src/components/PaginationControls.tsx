interface Props {
	currentPage: number
	lastPage: number
	total: number
	itemLabel: string
	onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, lastPage, total, itemLabel, onPageChange }: Props) {
	if (lastPage <= 1) return null

	return (
		<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-xs font-bold text-subtle">
				Trang {currentPage}/{lastPage} · {total} {itemLabel}
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					disabled={currentPage <= 1}
					onClick={() => onPageChange(currentPage - 1)}
					className="btn btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
				>
					Trước
				</button>
				<button
					type="button"
					disabled={currentPage >= lastPage}
					onClick={() => onPageChange(currentPage + 1)}
					className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
				>
					Tiếp
				</button>
			</div>
		</div>
	)
}
