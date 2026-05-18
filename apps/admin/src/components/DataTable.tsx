import type { ColumnDef } from "@tanstack/react-table"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Empty, Table } from "antd"
import type { ColumnType } from "antd/es/table"

interface TableProps<T> {
	data: T[]
	columns: ColumnDef<T, unknown>[]
	pagination?: { pageSize: number }
	className?: string
	emptyMessage?: string
}

export function DataTable<T extends object>({
	data,
	columns,
	pagination,
	className,
	emptyMessage = "Không có dữ liệu.",
}: TableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const antdColumns: ColumnType<T>[] = table.getAllLeafColumns().map((col, idx) => {
		const header = col.columnDef.header
		const headerNode =
			typeof header === "function"
				? flexRender(header, table.getHeaderGroups()[0].headers[idx].getContext())
				: header
		return {
			key: col.id,
			title: headerNode as React.ReactNode,
			sorter: col.getCanSort()
				? (a: T, b: T) => {
						const av = (a as Record<string, unknown>)[col.id]
						const bv = (b as Record<string, unknown>)[col.id]
						if (typeof av === "number" && typeof bv === "number") return av - bv
						return String(av ?? "").localeCompare(String(bv ?? ""))
					}
				: undefined,
			render: (_: unknown, _record: T, rowIndex: number) => {
				const row = table.getRowModel().rows[rowIndex]
				if (!row) return null
				const cell = row.getVisibleCells().find((c) => c.column.id === col.id)
				return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null
			},
		}
	})

	return (
		<Table<T>
			className={className}
			rowKey={(_, idx) => String(idx)}
			columns={antdColumns}
			dataSource={data}
			pagination={pagination ? { pageSize: pagination.pageSize, showSizeChanger: false } : false}
			locale={{ emptyText: <Empty description={emptyMessage} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
			size="middle"
		/>
	)
}
