// queryOptions factory cho trang Overview.
// Để nối API thật:
//   1. Tạo lib/api/overview.ts với hàm apiFetchOverview()
//   2. Thay queryFn: mockFetchOverview → apiFetchOverview
//   3. Xóa import mock

import { queryOptions } from "@tanstack/react-query"
import { mockFetchOverview } from "#/mocks/overview"

export const overviewQueryOptions = () =>
	queryOptions({
		queryKey: ["overview"],
		queryFn: mockFetchOverview,
		staleTime: 1000 * 60 * 2, // 2 phút
	})
