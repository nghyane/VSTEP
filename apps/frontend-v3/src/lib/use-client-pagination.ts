import { useCallback, useEffect, useMemo, useState } from "react"

export function useClientPagination<T>(items: readonly T[], perPage: number) {
	const [page, setPage] = useState(1)
	const lastPage = Math.max(1, Math.ceil(items.length / perPage))
	const currentPage = Math.min(page, lastPage)

	useEffect(() => {
		if (page !== currentPage) setPage(currentPage)
	}, [page, currentPage])

	const setSafePage = useCallback(
		(nextPage: number) => {
			setPage(Math.min(Math.max(1, nextPage), lastPage))
		},
		[lastPage],
	)

	const pageItems = useMemo(() => {
		const start = (currentPage - 1) * perPage
		return items.slice(start, start + perPage)
	}, [items, currentPage, perPage])
	const placeholderCount = lastPage > 1 ? Math.max(0, perPage - pageItems.length) : 0

	return {
		page: currentPage,
		setPage: setSafePage,
		lastPage,
		total: items.length,
		pageItems,
		placeholderCount,
	}
}
