import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { cn } from "#/lib/utils"

interface TableProps<T> {
	data: T[]
	columns: ColumnDef<T, unknown>[]
	pagination?: { pageSize: number }
	className?: string
	emptyMessage?: string
}

export function DataTable<T>({
	data,
	columns,
	pagination,
	className,
	emptyMessage = "Không có dữ liệu.",
}: TableProps<T>) {
	const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([])

	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange: (updater) => {
			setSorting(typeof updater === "function" ? updater(sorting) : updater)
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
		initialState: pagination ? { pagination: { pageSize: pagination.pageSize } } : undefined,
	})

	return (
		<div className={cn("overflow-hidden rounded-(--radius-card) border border-border bg-surface", className)}>
			{data.length === 0 ? (
				<div className="flex items-center justify-center py-10 text-sm text-muted">{emptyMessage}</div>
			) : (
				<>
					<table className="w-full text-sm">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id} className="border-b border-border bg-surface-muted/50">
									{headerGroup.headers.map((header) => (
										<th key={header.id} className="h-10 px-4 text-left text-xs font-medium text-muted">
											{header.isPlaceholder ? null : (
												<div
													className={cn(
														"flex items-center gap-1",
														header.column.getCanSort() && "cursor-pointer select-none",
													)}
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(header.column.columnDef.header, header.getContext())}
													{header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
												</div>
											)}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-muted/30"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3 text-foreground">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>

					{pagination && table.getPageCount() > 1 && (
						<div className="flex items-center justify-between border-t border-border px-4 py-3">
							<div className="text-xs text-muted">
								Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="h-8 rounded-md border border-border px-3 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									Trước
								</button>
								<button
									type="button"
									className="h-8 rounded-md border border-border px-3 text-xs text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									Sau
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}

function SortIcon({ sorted }: { sorted: string | false }) {
	if (sorted === "asc") return <ChevronUp className="size-3.5 text-foreground" />
	if (sorted === "desc") return <ChevronDown className="size-3.5 text-foreground" />
	return <ChevronsUpDown className="size-3.5 text-subtle" />
}
