import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type {
	ActionItem,
	ActivityItem,
	AdminNotificationItem,
	AlertItem,
	ContentStatusItem,
	GradingThroughputRow,
	PracticeActivityRow,
	ProfileSegments,
	PromoStats,
	RevenueOverview,
	RevenueTrendRow,
	StatsData,
	StreakBucket,
	TopContent,
	UserGrowthRow,
	WalletEconomy,
} from "./types"

const get = <T>(path: string) => api.get(path).json<ApiResponse<T>>()

const STALE_1M = 60_000
const STALE_5M = 300_000

export const useStats = () =>
	useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => get<StatsData>("admin/stats"),
		select: (r) => r.data,
		staleTime: STALE_1M,
	})

export const useAlerts = (disabled = false) =>
	useQuery({
		queryKey: ["admin", "alerts"],
		queryFn: () => get<AlertItem[]>("admin/alerts"),
		select: (r) => r.data,
		staleTime: STALE_1M,
		enabled: !disabled,
	})

export const useActionItems = () =>
	useQuery({
		queryKey: ["admin", "action-items"],
		queryFn: () => get<ActionItem[]>("admin/action-items"),
		select: (r) => r.data,
		staleTime: STALE_1M,
	})

export const useContentStatus = () =>
	useQuery({
		queryKey: ["admin", "content-status"],
		queryFn: () => get<ContentStatusItem[]>("admin/content-status"),
		select: (r) => r.data,
		staleTime: STALE_1M,
	})

export const useRecentActivity = () =>
	useQuery({
		queryKey: ["admin", "recent-activity"],
		queryFn: () => get<ActivityItem[]>("admin/recent-activity"),
		select: (r) => r.data,
		staleTime: STALE_1M,
	})

export const useRevenueOverview = () =>
	useQuery({
		queryKey: ["admin", "analytics", "revenue-overview"],
		queryFn: () => get<RevenueOverview>("admin/analytics/revenue-overview"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useRevenueTrend = (days = 30) =>
	useQuery({
		queryKey: ["admin", "analytics", "revenue-trend", days],
		queryFn: () => get<RevenueTrendRow[]>(`admin/analytics/revenue-trend?days=${days}`),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useUserGrowth = (days = 30) =>
	useQuery({
		queryKey: ["admin", "analytics", "user-growth", days],
		queryFn: () => get<UserGrowthRow[]>(`admin/analytics/user-growth?days=${days}`),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useWalletEconomy = () =>
	useQuery({
		queryKey: ["admin", "analytics", "wallet-economy"],
		queryFn: () => get<WalletEconomy>("admin/analytics/wallet-economy"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const usePracticeActivity = (days = 30) =>
	useQuery({
		queryKey: ["admin", "analytics", "practice-activity", days],
		queryFn: () => get<PracticeActivityRow[]>(`admin/analytics/practice-activity?days=${days}`),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useGradingThroughput = (days = 30) =>
	useQuery({
		queryKey: ["admin", "analytics", "grading-throughput", days],
		queryFn: () => get<GradingThroughputRow[]>(`admin/analytics/grading-throughput?days=${days}`),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useProfileSegments = () =>
	useQuery({
		queryKey: ["admin", "analytics", "profile-segments"],
		queryFn: () => get<ProfileSegments>("admin/analytics/profile-segments"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useStreakDistribution = () =>
	useQuery({
		queryKey: ["admin", "analytics", "streak-distribution"],
		queryFn: () => get<StreakBucket[]>("admin/analytics/streak-distribution"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const usePromoStats = () =>
	useQuery({
		queryKey: ["admin", "analytics", "promo-stats"],
		queryFn: () => get<PromoStats>("admin/analytics/promo-stats"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useTopContent = () =>
	useQuery({
		queryKey: ["admin", "analytics", "top-content"],
		queryFn: () => get<TopContent>("admin/analytics/top-content"),
		select: (r) => r.data,
		staleTime: STALE_5M,
	})

export const useAdminNotifications = (disabled = false) =>
	useQuery({
		queryKey: ["admin", "notifications"],
		queryFn: () => get<AdminNotificationItem[]>("admin/notifications"),
		select: (r) => r.data,
		staleTime: 30_000,
		refetchInterval: 60_000,
		enabled: !disabled,
	})

export const useUnreadCount = (disabled = false) =>
	useQuery({
		queryKey: ["admin", "notifications", "unread-count"],
		queryFn: () => get<{ count: number }>("admin/notifications/unread-count"),
		select: (r) => r.data.count,
		staleTime: 30_000,
		refetchInterval: 60_000,
		enabled: !disabled,
	})

export const useMarkAllRead = () => {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.post("admin/notifications/mark-all-read").json(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "notifications"] })
		},
	})
}
