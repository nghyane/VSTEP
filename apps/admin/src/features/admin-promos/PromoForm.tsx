import { ThunderboltOutlined } from "@ant-design/icons"
import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Switch } from "#/components/Switch"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import { useGeneratePromoCode } from "./queries"
import type { AdminPromoCode, CreatePromoInput, UpdatePromoInput } from "./types"

interface CreateProps {
	mode: "create"
	onSubmit: (input: CreatePromoInput) => Promise<void>
	onCancel: () => void
	submitting: boolean
}

interface EditProps {
	mode: "edit"
	initial: AdminPromoCode
	hasRedemptions: boolean
	onSubmit: (input: UpdatePromoInput) => Promise<void>
	onCancel: () => void
	submitting: boolean
}

type Props = CreateProps | EditProps

interface State {
	code: string
	partner_name: string
	amount_coins: number
	max_total_uses: string // "" = unlimited
	per_account_limit: number
	expires_at: string // datetime-local format, "" = no expiry
	is_active: boolean
}

function toLocalInput(iso: string | null): string {
	if (!iso) return ""
	const d = new Date(iso)
	const pad = (n: number) => String(n).padStart(2, "0")
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PromoForm(props: Props) {
	const isEdit = props.mode === "edit"
	const initial = isEdit ? props.initial : null
	const hasRedemptions = isEdit ? props.hasRedemptions : false

	const [state, setState] = useState<State>({
		code: initial?.code ?? "",
		partner_name: initial?.partner_name ?? "",
		amount_coins: initial?.amount_coins ?? 100,
		max_total_uses: initial?.max_total_uses?.toString() ?? "",
		per_account_limit: initial?.per_account_limit ?? 1,
		expires_at: toLocalInput(initial?.expires_at ?? null),
		is_active: initial?.is_active ?? true,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	const generate = useGeneratePromoCode()

	function set<K extends keyof State>(k: K, v: State[K]): void {
		setState((s) => ({ ...s, [k]: v }))
	}

	async function handleGenerate(): Promise<void> {
		try {
			const res = await generate.mutateAsync()
			set("code", res.data.code)
		} catch {
			// silent — UI giữ nguyên, admin có thể nhập tay
		}
	}

	function buildPayload(): CreatePromoInput {
		return {
			code: state.code.trim().toUpperCase(),
			partner_name: state.partner_name.trim() || null,
			amount_coins: Number(state.amount_coins),
			max_total_uses: state.max_total_uses === "" ? null : Number(state.max_total_uses),
			per_account_limit: Number(state.per_account_limit),
			expires_at: state.expires_at ? new Date(state.expires_at).toISOString() : null,
			is_active: state.is_active,
		}
	}

	async function handle(e: FormEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			const payload = buildPayload()
			if (isEdit) {
				await props.onSubmit(payload)
			} else {
				await props.onSubmit(payload)
			}
		} catch (err) {
			const x = await extractError(err)
			if (x.errors && Object.keys(x.errors).length > 0) setErrors(x.errors)
			setGeneric(formatApiErrorBanner(x))
		}
	}

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				{generic && <Alert type="error" message={generic} showIcon closable style={{ marginBottom: 12 }} />}
				{isEdit && hasRedemptions && (
					<Alert
						type="warning"
						showIcon
						message="Mã đã có người dùng quy đổi — không thể đổi text của mã. Có thể chỉnh quota / hạn / trạng thái."
						style={{ marginBottom: 12 }}
					/>
				)}

				<Row gutter={16}>
					<Col span={16}>
						<FormField label="Mã code" htmlFor="code" required error={errors.code}>
							<Input
								id="code"
								value={state.code}
								onChange={(e) => set("code", e.target.value.toUpperCase())}
								invalid={!!errors.code}
								disabled={isEdit && hasRedemptions}
								placeholder="VD: NEWYEAR2026"
								suffix={
									isEdit ? undefined : (
										<Button
											variant="ghost"
											size="sm"
											icon={<ThunderboltOutlined />}
											onClick={handleGenerate}
											loading={generate.isPending}
										>
											Sinh
										</Button>
									)
								}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Đối tác" htmlFor="partner_name" error={errors.partner_name}>
							<Input
								id="partner_name"
								value={state.partner_name}
								onChange={(e) => set("partner_name", e.target.value)}
								invalid={!!errors.partner_name}
								placeholder="VD: BABA"
							/>
						</FormField>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={8}>
						<FormField label="Số xu tặng" htmlFor="amount_coins" required error={errors.amount_coins}>
							<Input
								id="amount_coins"
								type="number"
								min={1}
								value={state.amount_coins}
								onChange={(e) => set("amount_coins", Number(e.target.value))}
								invalid={!!errors.amount_coins}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField
							label="Tổng lượt tối đa"
							htmlFor="max_total_uses"
							error={errors.max_total_uses}
							helper="Để trống = không giới hạn."
						>
							<Input
								id="max_total_uses"
								type="number"
								min={1}
								value={state.max_total_uses}
								onChange={(e) => set("max_total_uses", e.target.value)}
								invalid={!!errors.max_total_uses}
								placeholder="Không giới hạn"
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField
							label="Mỗi tài khoản"
							htmlFor="per_account_limit"
							required
							error={errors.per_account_limit}
							helper="Số lần tối đa 1 user dùng được mã."
						>
							<Input
								id="per_account_limit"
								type="number"
								min={1}
								value={state.per_account_limit}
								onChange={(e) => set("per_account_limit", Number(e.target.value))}
								invalid={!!errors.per_account_limit}
							/>
						</FormField>
					</Col>
				</Row>

				<Row gutter={16} align="bottom">
					<Col span={16}>
						<FormField
							label="Hạn sử dụng"
							htmlFor="expires_at"
							error={errors.expires_at}
							helper="Để trống = không hết hạn."
						>
							<Input
								id="expires_at"
								type="datetime-local"
								value={state.expires_at}
								onChange={(e) => set("expires_at", e.target.value)}
								invalid={!!errors.expires_at}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Trạng thái" htmlFor="is_active">
							<Flex align="center" gap={8} style={{ paddingTop: 4 }}>
								<Switch checked={state.is_active} onChange={(v) => set("is_active", v)} />
								<span>{state.is_active ? "Đang hoạt động" : "Đã tắt"}</span>
							</Flex>
						</FormField>
					</Col>
				</Row>

				<Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
					<Button variant="ghost" onClick={props.onCancel} disabled={props.submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={props.submitting}>
						{isEdit ? "Cập nhật" : "Tạo mã"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
