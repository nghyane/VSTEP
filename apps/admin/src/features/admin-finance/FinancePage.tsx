import {
	EyeOutlined,
	MinusCircleOutlined,
	PlusCircleOutlined,
	ShoppingOutlined,
	WalletOutlined,
} from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import {
	Button,
	Card,
	Col,
	Collapse,
	Descriptions,
	Drawer,
	Empty,
	Flex,
	Input,
	Row,
	Select,
	Space,
	Statistic,
	Table,
	Tabs,
	Tag,
	Typography,
} from "antd"
import { useState } from "react"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"
import { formatDateTime } from "#/lib/utils"
import { formatNum, formatVnd } from "#/routes/_app/-dashboard/utils"

type OrderType = "topup" | "course"
type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "expired"

interface FinanceSummary {
	revenue: {
		today: number
		week: number
		month: number
		total: number
		topup_total: number
		course_total: number
	}
	orders: Record<OrderStatus | "total" | "success_rate", number>
	sources: Record<OrderType, { orders: number; paid_orders: number; revenue_vnd: number }>
}

interface FinanceOrder {
	id: string
	type: OrderType
	type_label: string
	status: OrderStatus
	amount_vnd: number
	provider: string | null
	provider_ref: string | null
	order_code: number | null
	gateway_transaction_id: string | null
	user: { id: string; name: string | null; email: string } | null
	profile: { id: string; nickname: string | null } | null
	item: { id: string | null; name: string; kind: OrderType }
	created_at: string | null
	paid_at: string | null
}

interface FinanceOrderDetail extends FinanceOrder {
	gateway_response: unknown
	coins_to_credit?: number
	callback_received_at: string | null
	expires_at: string | null
}

interface TopProducts {
	topup: ProductRow[]
	course: ProductRow[]
}

interface ProductRow {
	name: string
	orders: number
	revenue_vnd: number
}

interface OrderFilters {
	page: number
	per_page: number
	type?: OrderType
	status?: OrderStatus
	q?: string
	from?: string
	to?: string
}

type CoinDirection = "credit" | "debit"

interface CoinSummary {
	totals: {
		transactions: number
		credit_total: number
		debit_total: number
		net_total: number
		active_users: number
	}
	breakdown: CoinBreakdown[]
}

interface CoinBreakdown {
	type: string
	transactions: number
	credit_total: number
	debit_total: number
	net_total: number
}

interface CoinTransaction {
	id: number
	type: string
	delta: number
	balance_after: number
	source_type: string | null
	source_id: string | null
	metadata: unknown
	created_at: string | null
	user: { id: string; name: string | null; email: string } | null
	profile: { id: string; nickname: string | null } | null
}

interface CoinFilters {
	page: number
	per_page: number
	q?: string
	type?: string
	direction?: CoinDirection
	source_type?: string
	from?: string
	to?: string
}

const STATUS_LABEL: Record<OrderStatus, string> = {
	pending: "Chờ thanh toán",
	paid: "Đã thanh toán",
	failed: "Thất bại",
	cancelled: "Đã hủy",
	expired: "Hết hạn",
}

const STATUS_COLOR: Record<OrderStatus, string> = {
	pending: "processing",
	paid: "success",
	failed: "error",
	cancelled: "default",
	expired: "warning",
}

const COIN_TYPE_LABEL: Record<string, string> = {
	topup: "Nạp xu",
	onboarding_bonus: "Quà chào mừng",
	course_bonus: "Thưởng khóa học",
	promo_redeem: "Mã khuyến mãi",
	streak_milestone: "Thưởng streak",
	refund: "Hoàn xu",
	exam_custom: "Thi tùy chỉnh",
	exam_full: "Thi full-test",
	course_purchase: "Mua khóa học",
	teacher_booking: "Đặt lịch 1-1",
	practice_feedback: "Feedback bài luyện",
}

const COIN_SOURCE_LABEL: Record<string, string> = {
	wallet_topup_order: "Đơn nạp xu",
	promo_code_redemption: "Đổi mã khuyến mãi",
	promo_code: "Mã khuyến mãi",
	course_enrollment: "Ghi danh khóa học",
	practice_session: "Phiên luyện tập",
	practice_feedback_request: "Yêu cầu feedback",
	profile: "Hồ sơ học tập",
	profile_streak_claim: "Nhận thưởng streak",
	teacher_booking: "Lịch học 1-1",
}

function buildSearch(filters: OrderFilters): string {
	const params = new URLSearchParams()
	params.set("page", String(filters.page))
	params.set("per_page", String(filters.per_page))
	if (filters.type) params.set("type", filters.type)
	if (filters.status) params.set("status", filters.status)
	if (filters.q) params.set("q", filters.q)
	if (filters.from) params.set("from", filters.from)
	if (filters.to) params.set("to", filters.to)
	return `?${params.toString()}`
}

function buildCoinSearch(filters: CoinFilters): string {
	const params = new URLSearchParams()
	params.set("page", String(filters.page))
	params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.type) params.set("type", filters.type)
	if (filters.direction) params.set("direction", filters.direction)
	if (filters.source_type) params.set("source_type", filters.source_type)
	if (filters.from) params.set("from", filters.from)
	if (filters.to) params.set("to", filters.to)
	return `?${params.toString()}`
}

const useFinanceSummary = () =>
	useQuery({
		queryKey: ["admin", "finance", "summary"],
		queryFn: () => api.get("admin/finance/summary").json<ApiResponse<FinanceSummary>>(),
		select: (r) => r.data,
		staleTime: 60_000,
		refetchInterval: 10_000,
	})

const useFinanceOrders = (filters: OrderFilters) =>
	useQuery({
		queryKey: ["admin", "finance", "orders", filters],
		queryFn: () =>
			api.get(`admin/finance/orders${buildSearch(filters)}`).json<PaginatedResponse<FinanceOrder>>(),
		staleTime: 30_000,
		refetchInterval: 5_000,
	})

const useFinanceOrderDetail = (selected: Pick<FinanceOrder, "type" | "id"> | null) =>
	useQuery({
		queryKey: ["admin", "finance", "order-detail", selected],
		queryFn: () => {
			if (selected === null) throw new Error("Missing selected finance order.")
			return api
				.get(`admin/finance/orders/${selected.type}/${selected.id}`)
				.json<ApiResponse<FinanceOrderDetail>>()
		},
		select: (r) => r.data,
		enabled: selected !== null,
		refetchInterval: selected === null ? false : 5_000,
	})

const useTopProducts = () =>
	useQuery({
		queryKey: ["admin", "finance", "top-products"],
		queryFn: () => api.get("admin/finance/top-products").json<ApiResponse<TopProducts>>(),
		select: (r) => r.data,
		staleTime: 60_000,
		refetchInterval: 10_000,
	})

const useCoinSummary = () =>
	useQuery({
		queryKey: ["admin", "finance", "coin-summary"],
		queryFn: () => api.get("admin/finance/coin-summary").json<ApiResponse<CoinSummary>>(),
		select: (r) => r.data,
		staleTime: 60_000,
		refetchInterval: 10_000,
	})

const useCoinTransactions = (filters: CoinFilters) =>
	useQuery({
		queryKey: ["admin", "finance", "coin-transactions", filters],
		queryFn: () =>
			api
				.get(`admin/finance/coin-transactions${buildCoinSearch(filters)}`)
				.json<PaginatedResponse<CoinTransaction>>(),
		staleTime: 30_000,
		refetchInterval: 10_000,
	})

export function FinancePage() {
	return (
		<Flex vertical gap={20}>
			<div>
				<Typography.Title level={3} style={{ margin: 0 }}>
					Đơn hàng & dòng tiền
				</Typography.Title>
				<Typography.Text type="secondary">
					Theo dõi doanh thu, trạng thái thanh toán và lịch sử mua hàng từ PayOS.
				</Typography.Text>
			</div>

			<Tabs
				items={[
					{ key: "overview", label: "Tổng quan", children: <FinanceOverview /> },
					{ key: "orders", label: "Đơn hàng", children: <OrdersTab /> },
					{ key: "products", label: "Sản phẩm bán chạy", children: <ProductsTab /> },
					{ key: "coins", label: "Giao dịch xu", children: <CoinTransactionsTab /> },
				]}
			/>
		</Flex>
	)
}

function FinanceOverview() {
	const summary = useFinanceSummary()
	const data = summary.data

	return (
		<Flex vertical gap={16}>
			<Row gutter={[16, 16]}>
				<StatCard
					title="Doanh thu hôm nay"
					value={formatVnd(data?.revenue.today ?? 0)}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Doanh thu 7 ngày"
					value={formatVnd(data?.revenue.week ?? 0)}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Doanh thu 30 ngày"
					value={formatVnd(data?.revenue.month ?? 0)}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Tổng doanh thu"
					value={formatVnd(data?.revenue.total ?? 0)}
					loading={summary.isLoading}
				/>
			</Row>

			<Row gutter={[16, 16]}>
				<StatCard
					title="Đơn đang chờ"
					value={String(data?.orders.pending ?? 0)}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Đơn đã thanh toán"
					value={String(data?.orders.paid ?? 0)}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Đơn lỗi/hủy"
					value={String((data?.orders.failed ?? 0) + (data?.orders.cancelled ?? 0))}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Tỷ lệ thành công"
					value={`${data?.orders.success_rate ?? 0}%`}
					loading={summary.isLoading}
				/>
			</Row>

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<Card title="Nạp coin" loading={summary.isLoading}>
						<Descriptions column={1} size="small">
							<Descriptions.Item label="Doanh thu">
								{formatVnd(data?.sources.topup.revenue_vnd ?? 0)}
							</Descriptions.Item>
							<Descriptions.Item label="Đơn paid">{data?.sources.topup.paid_orders ?? 0}</Descriptions.Item>
							<Descriptions.Item label="Tổng đơn">{data?.sources.topup.orders ?? 0}</Descriptions.Item>
						</Descriptions>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title="Khóa học" loading={summary.isLoading}>
						<Descriptions column={1} size="small">
							<Descriptions.Item label="Doanh thu">
								{formatVnd(data?.sources.course.revenue_vnd ?? 0)}
							</Descriptions.Item>
							<Descriptions.Item label="Đơn paid">{data?.sources.course.paid_orders ?? 0}</Descriptions.Item>
							<Descriptions.Item label="Tổng đơn">{data?.sources.course.orders ?? 0}</Descriptions.Item>
						</Descriptions>
					</Card>
				</Col>
			</Row>
		</Flex>
	)
}

function StatCard({ title, value, loading }: { title: string; value: string; loading: boolean }) {
	return (
		<Col xs={24} sm={12} xl={6}>
			<Card loading={loading}>
				<Statistic title={title} value={value} />
			</Card>
		</Col>
	)
}

function OrdersTab() {
	const [filters, setFilters] = useState<OrderFilters>({ page: 1, per_page: 20 })
	const [selected, setSelected] = useState<Pick<FinanceOrder, "type" | "id"> | null>(null)
	const orders = useFinanceOrders(filters)
	const detail = useFinanceOrderDetail(selected)

	return (
		<Flex vertical gap={16}>
			<Card>
				<Space wrap>
					<Input.Search
						allowClear
						placeholder="Email, tên, mã đơn, mã giao dịch"
						style={{ width: 280 }}
						onSearch={(q) => setFilters((prev) => ({ ...prev, q: q || undefined, page: 1 }))}
					/>
					<Select
						allowClear
						placeholder="Loại đơn"
						style={{ width: 160 }}
						onChange={(type?: OrderType) => setFilters((prev) => ({ ...prev, type, page: 1 }))}
						options={[
							{ value: "topup", label: "Nạp coin" },
							{ value: "course", label: "Mua khóa học" },
						]}
					/>
					<Select
						allowClear
						placeholder="Trạng thái"
						style={{ width: 180 }}
						onChange={(status?: OrderStatus) => setFilters((prev) => ({ ...prev, status, page: 1 }))}
						options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
					/>
					<Input
						type="date"
						style={{ width: 160 }}
						onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value || undefined, page: 1 }))}
					/>
					<Input
						type="date"
						style={{ width: 160 }}
						onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value || undefined, page: 1 }))}
					/>
				</Space>
			</Card>

			<Table
				rowKey={(row) => `${row.type}:${row.id}`}
				loading={orders.isLoading}
				dataSource={orders.data?.data ?? []}
				pagination={{
					current: orders.data?.meta.current_page ?? filters.page,
					pageSize: orders.data?.meta.per_page ?? filters.per_page,
					total: orders.data?.meta.total ?? 0,
					onChange: (page, per_page) => setFilters((prev) => ({ ...prev, page, per_page })),
				}}
				columns={[
					{
						title: "Thời gian",
						dataIndex: "created_at",
						render: (value: string | null) => formatDateTime(value),
					},
					{
						title: "Loại",
						render: (_, row) => (
							<Tag icon={row.type === "topup" ? <WalletOutlined /> : <ShoppingOutlined />}>
								{row.type_label}
							</Tag>
						),
					},
					{ title: "Mã đơn", dataIndex: "order_code", render: (value: number | null) => value ?? "-" },
					{ title: "Người mua", render: (_, row) => <UserCell order={row} /> },
					{ title: "Sản phẩm", render: (_, row) => row.item.name },
					{
						title: "Số tiền",
						dataIndex: "amount_vnd",
						align: "right",
						render: (value: number) => formatVnd(value),
					},
					{
						title: "Trạng thái",
						render: (_, row) => <Tag color={STATUS_COLOR[row.status]}>{STATUS_LABEL[row.status]}</Tag>,
					},
					{
						title: "Cổng TT",
						dataIndex: "provider",
						render: (value: string | null) => paymentProviderLabel(value),
					},
					{
						title: "",
						align: "right",
						render: (_, row) => (
							<Button icon={<EyeOutlined />} onClick={() => setSelected({ type: row.type, id: row.id })}>
								Chi tiết
							</Button>
						),
					},
				]}
			/>

			<OrderDrawer
				order={detail.data}
				loading={detail.isLoading}
				open={selected !== null}
				onClose={() => setSelected(null)}
			/>
		</Flex>
	)
}

function UserCell({ order }: { order: FinanceOrder }) {
	return (
		<Flex vertical>
			<Typography.Text>{order.user?.name || order.profile?.nickname || "-"}</Typography.Text>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{order.user?.email ?? "-"}
			</Typography.Text>
		</Flex>
	)
}

function OrderDrawer({
	order,
	loading,
	open,
	onClose,
}: {
	order: FinanceOrderDetail | undefined
	loading: boolean
	open: boolean
	onClose: () => void
}) {
	return (
		<Drawer title="Chi tiết đơn hàng" width={680} open={open} onClose={onClose}>
			{loading && <Card loading />}
			{!loading && !order && <Empty description="Không có dữ liệu" />}
			{!loading && order && (
				<Flex vertical gap={16}>
					<Card>
						<Flex justify="space-between" gap={12} wrap>
							<Flex vertical gap={4}>
								<Typography.Text type="secondary">{order.type_label}</Typography.Text>
								<Typography.Title level={4} style={{ margin: 0 }}>
									{order.item.name}
								</Typography.Title>
							</Flex>
							<Flex vertical align="end" gap={6}>
								<Typography.Title level={4} style={{ margin: 0 }}>
									{formatVnd(order.amount_vnd)}
								</Typography.Title>
								<Tag color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Tag>
							</Flex>
						</Flex>
					</Card>

					<Descriptions title="Thông tin mua hàng" column={1} bordered size="small">
						<Descriptions.Item label="Loại đơn">{order.type_label}</Descriptions.Item>
						<Descriptions.Item label="Trạng thái">
							<Tag color={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Mã đơn thanh toán">{order.order_code ?? "-"}</Descriptions.Item>
						<Descriptions.Item label="Số tiền">{formatVnd(order.amount_vnd)}</Descriptions.Item>
						<Descriptions.Item label="Sản phẩm">{order.item.name}</Descriptions.Item>
						<Descriptions.Item label="Người mua">{order.user?.name ?? "-"}</Descriptions.Item>
						<Descriptions.Item label="Email">{order.user?.email ?? "-"}</Descriptions.Item>
						<Descriptions.Item label="Cổng thanh toán">
							{paymentProviderLabel(order.provider)}
						</Descriptions.Item>
						<Descriptions.Item label="Tạo lúc">{formatDateTime(order.created_at)}</Descriptions.Item>
						<Descriptions.Item label="Thanh toán lúc">{formatDateTime(order.paid_at)}</Descriptions.Item>
						<Descriptions.Item label="Hết hạn lúc">{formatDateTime(order.expires_at)}</Descriptions.Item>
						{order.coins_to_credit !== undefined && (
							<Descriptions.Item label="Coin nhận">{order.coins_to_credit}</Descriptions.Item>
						)}
					</Descriptions>

					<Collapse
						items={[
							{
								key: "technical",
								label: "Thông tin kỹ thuật / đối soát",
								children: (
									<Flex vertical gap={12}>
										<Typography.Text type="secondary">
											Phần này chỉ dùng khi cần kiểm tra với PayOS hoặc gửi cho kỹ thuật.
										</Typography.Text>
										<Descriptions column={1} bordered size="small">
											<Descriptions.Item label="Mã tham chiếu PayOS">
												{order.provider_ref ?? "-"}
											</Descriptions.Item>
											<Descriptions.Item label="Mã giao dịch PayOS">
												{order.gateway_transaction_id ?? "-"}
											</Descriptions.Item>
											<Descriptions.Item label="Callback lúc">
												{formatDateTime(order.callback_received_at)}
											</Descriptions.Item>
										</Descriptions>
										<pre
											style={{
												maxHeight: 220,
												overflow: "auto",
												margin: 0,
												padding: 12,
												background: "#fafafa",
												borderRadius: 8,
											}}
										>
											{JSON.stringify(order.gateway_response ?? {}, null, 2)}
										</pre>
									</Flex>
								),
							},
						]}
					/>
				</Flex>
			)}
		</Drawer>
	)
}

function ProductsTab() {
	const products = useTopProducts()

	return (
		<Row gutter={[16, 16]}>
			<Col xs={24} lg={12}>
				<ProductTable
					title="Gói nạp bán chạy"
					data={products.data?.topup ?? []}
					loading={products.isLoading}
				/>
			</Col>
			<Col xs={24} lg={12}>
				<ProductTable
					title="Khóa học bán chạy"
					data={products.data?.course ?? []}
					loading={products.isLoading}
				/>
			</Col>
		</Row>
	)
}

function CoinTransactionsTab() {
	const today = new Date()
	const defaultFrom = new Date(today)
	defaultFrom.setDate(today.getDate() - 30)
	const [filters, setFilters] = useState<CoinFilters>({
		page: 1,
		per_page: 20,
		from: toDateInput(defaultFrom),
		to: toDateInput(today),
	})
	const summary = useCoinSummary()
	const transactions = useCoinTransactions(filters)

	return (
		<Flex vertical gap={16}>
			<Row gutter={[16, 16]}>
				<StatCard
					title="Tổng xu đã cộng"
					value={`${formatNum(summary.data?.totals.credit_total ?? 0)} xu`}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Tổng xu đã trừ"
					value={`${formatNum(summary.data?.totals.debit_total ?? 0)} xu`}
					loading={summary.isLoading}
				/>
				<StatCard
					title="Net flow"
					value={`${formatSignedCoin(summary.data?.totals.net_total ?? 0)} xu`}
					loading={summary.isLoading}
				/>
				<StatCard
					title="User có giao dịch"
					value={String(summary.data?.totals.active_users ?? 0)}
					loading={summary.isLoading}
				/>
			</Row>

			<CoinFilterCard filters={filters} setFilters={setFilters} />
			<Card title="Lịch sử giao dịch xu">
				<CoinTransactionTable transactions={transactions} filters={filters} setFilters={setFilters} />
			</Card>
			<Card title="Breakdown theo loại giao dịch">
				<Table
					rowKey="type"
					loading={summary.isLoading}
					dataSource={summary.data?.breakdown ?? []}
					pagination={false}
					columns={[
						{ title: "Loại", render: (_, row) => <NoWrap>{coinTypeLabel(row.type)}</NoWrap> },
						{ title: "Giao dịch", dataIndex: "transactions", align: "right", width: 140 },
						{
							title: "Xu cộng",
							dataIndex: "credit_total",
							align: "right",
							width: 140,
							render: (value: number) => `${formatNum(value)} xu`,
						},
						{
							title: "Xu trừ",
							dataIndex: "debit_total",
							align: "right",
							width: 140,
							render: (value: number) => `${formatNum(value)} xu`,
						},
						{
							title: "Net",
							dataIndex: "net_total",
							align: "right",
							width: 140,
							render: (value: number) => <CoinDelta value={value} />,
						},
					]}
				/>
			</Card>
		</Flex>
	)
}

function CoinFilterCard({
	filters,
	setFilters,
}: {
	filters: CoinFilters
	setFilters: React.Dispatch<React.SetStateAction<CoinFilters>>
}) {
	return (
		<Card>
			<Space wrap>
				<Input.Search
					allowClear
					placeholder="Email, tên, profile, mã nguồn"
					style={{ width: 320 }}
					onSearch={(q) => setFilters((prev) => ({ ...prev, q: q || undefined, page: 1 }))}
				/>
				<Select
					allowClear
					placeholder="Loại giao dịch"
					style={{ width: 190 }}
					onChange={(type?: string) => setFilters((prev) => ({ ...prev, type, page: 1 }))}
					options={Object.keys(COIN_TYPE_LABEL).map((value) => ({ value, label: COIN_TYPE_LABEL[value] }))}
				/>
				<Select
					allowClear
					placeholder="Hướng"
					style={{ width: 140 }}
					onChange={(direction?: CoinDirection) => setFilters((prev) => ({ ...prev, direction, page: 1 }))}
					options={[
						{ value: "credit", label: "Cộng xu" },
						{ value: "debit", label: "Trừ xu" },
					]}
				/>
				<Select
					allowClear
					placeholder="Nguồn"
					style={{ width: 190 }}
					onChange={(source_type?: string) => setFilters((prev) => ({ ...prev, source_type, page: 1 }))}
					options={Object.keys(COIN_SOURCE_LABEL).map((value) => ({
						value,
						label: COIN_SOURCE_LABEL[value],
					}))}
				/>
				<Input
					type="date"
					value={filters.from}
					style={{ width: 150 }}
					onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value || undefined, page: 1 }))}
				/>
				<Input
					type="date"
					value={filters.to}
					style={{ width: 150 }}
					onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value || undefined, page: 1 }))}
				/>
			</Space>
		</Card>
	)
}

function CoinTransactionTable({
	transactions,
	filters,
	setFilters,
}: {
	transactions: ReturnType<typeof useCoinTransactions>
	filters: CoinFilters
	setFilters: React.Dispatch<React.SetStateAction<CoinFilters>>
}) {
	return (
		<Table
			rowKey="id"
			loading={transactions.isLoading}
			dataSource={transactions.data?.data ?? []}
			scroll={{ x: 1120 }}
			pagination={{
				current: transactions.data?.meta.current_page ?? filters.page,
				pageSize: transactions.data?.meta.per_page ?? filters.per_page,
				total: transactions.data?.meta.total ?? 0,
				onChange: (page, per_page) => setFilters((prev) => ({ ...prev, page, per_page })),
			}}
			columns={[
				{
					title: "Thời gian",
					dataIndex: "created_at",
					width: 150,
					render: (value: string | null) => formatDateTime(value),
				},
				{ title: "User", width: 240, render: (_, row) => <CoinUserCell transaction={row} /> },
				{
					title: "Loại giao dịch",
					width: 170,
					render: (_, row) => <NoWrap>{coinTypeLabel(row.type)}</NoWrap>,
				},
				{
					title: "+/- xu",
					dataIndex: "delta",
					align: "right",
					width: 130,
					render: (value: number) => <CoinDelta value={value} />,
				},
				{
					title: "Số dư sau",
					dataIndex: "balance_after",
					align: "right",
					width: 130,
					render: (value: number) => `${formatNum(value)} xu`,
				},
				{
					title: "Nguồn phát sinh",
					width: 170,
					render: (_, row) => <NoWrap>{coinSourceLabel(row.source_type)}</NoWrap>,
				},
				{
					title: "Mã nguồn",
					dataIndex: "source_id",
					width: 150,
					render: (value: string | null) => <NoWrap>{shortId(value)}</NoWrap>,
				},
			]}
		/>
	)
}

function CoinUserCell({ transaction }: { transaction: CoinTransaction }) {
	return (
		<Flex vertical style={{ maxWidth: 220 }}>
			<Typography.Text ellipsis>
				{transaction.user?.name || transaction.profile?.nickname || "-"}
			</Typography.Text>
			<Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
				{transaction.user?.email ?? "-"}
			</Typography.Text>
		</Flex>
	)
}

function NoWrap({ children }: { children: React.ReactNode }) {
	return <span style={{ whiteSpace: "nowrap" }}>{children}</span>
}

function CoinDelta({ value }: { value: number }) {
	const credit = value >= 0
	return (
		<Tag
			color={credit ? "success" : "error"}
			icon={credit ? <PlusCircleOutlined /> : <MinusCircleOutlined />}
		>
			{formatSignedCoin(value)} xu
		</Tag>
	)
}

function ProductTable({ title, data, loading }: { title: string; data: ProductRow[]; loading: boolean }) {
	return (
		<Card title={title}>
			<Table
				rowKey="name"
				loading={loading}
				dataSource={data}
				pagination={false}
				columns={[
					{ title: "Sản phẩm", dataIndex: "name" },
					{ title: "Đơn paid", dataIndex: "orders", align: "right" },
					{
						title: "Doanh thu",
						dataIndex: "revenue_vnd",
						align: "right",
						render: (value: number) => formatVnd(value),
					},
				]}
			/>
		</Card>
	)
}

function paymentProviderLabel(value: string | null): string {
	if (value === "payos") return "PayOS"
	return value ?? "-"
}

function coinTypeLabel(value: string): string {
	return COIN_TYPE_LABEL[value] ?? value.replaceAll("_", " ")
}

function coinSourceLabel(value: string | null): string {
	if (value === null) return "Nguồn hệ thống"
	return COIN_SOURCE_LABEL[value] ?? value
}

function formatSignedCoin(value: number): string {
	const sign = value > 0 ? "+" : value < 0 ? "-" : ""
	return `${sign}${formatNum(Math.abs(value))}`
}

function shortId(value: string | null): string {
	if (!value) return "-"
	return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

function toDateInput(date: Date): string {
	return date.toISOString().slice(0, 10)
}
