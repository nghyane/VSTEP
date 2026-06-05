import { EyeOutlined, ShoppingOutlined, WalletOutlined } from "@ant-design/icons"
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
import { formatVnd } from "#/routes/_app/-dashboard/utils"

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
