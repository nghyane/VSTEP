import { Alert, Divider, Flex, InputNumber, Switch } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import type { TopupPackageFormInput } from "#/features/admin-topup/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: Partial<TopupPackageFormInput>
	onSubmit: (input: TopupPackageFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function TopupPackageForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<TopupPackageFormInput>({
		label: initial?.label ?? "",
		amount_vnd: initial?.amount_vnd ?? 50000,
		coins_base: initial?.coins_base ?? 50,
		bonus_coins: initial?.bonus_coins ?? 0,
		display_order: initial?.display_order ?? 0,
		is_active: initial?.is_active ?? true,
		is_best_value: initial?.is_best_value ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof TopupPackageFormInput>(key: K, value: TopupPackageFormInput[K]) {
		setState((s) => ({ ...s, [key]: value }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit(state)
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	const totalCoins = state.coins_base + state.bonus_coins

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 16 }} />}
			<FormField label="Tên gói" required error={errors.label}>
				<Input
					value={state.label}
					onChange={(e) => set("label", e.target.value)}
					placeholder="Vd: Gói cơ bản 50K"
				/>
			</FormField>
			<Flex gap={16} align="start" wrap>
				<FormField
					label="Số tiền (VND)"
					required
					error={errors.amount_vnd}
					style={{ flex: "1 1 200px", minWidth: 180 }}
				>
					<InputNumber
						value={state.amount_vnd}
						onChange={(v) => set("amount_vnd", v ?? 0)}
						min={1000}
						step={10000}
						formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
						parser={(v) => Number((v ?? "").replace(/\./g, ""))}
						style={{ width: "100%" }}
						addonAfter="đ"
					/>
				</FormField>
				<FormField
					label="Coin cơ bản"
					required
					error={errors.coins_base}
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<InputNumber
						value={state.coins_base}
						onChange={(v) => set("coins_base", v ?? 0)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>
			<Flex gap={16} align="start" wrap>
				<FormField
					label="Coin tặng kèm"
					error={errors.bonus_coins}
					helper="Số coin bonus cộng thêm khi user mua gói này."
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<InputNumber
						value={state.bonus_coins}
						onChange={(v) => set("bonus_coins", v ?? 0)}
						min={0}
						style={{ width: "100%" }}
					/>
				</FormField>
				<FormField
					label="Thứ tự hiển thị"
					error={errors.display_order}
					helper="Số nhỏ hơn hiện trước. Mặc định 0."
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<InputNumber
						value={state.display_order}
						onChange={(v) => set("display_order", v ?? 0)}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>
			<FormField label="Tổng coin user nhận" helper="Tự tính từ coin cơ bản + coin tặng kèm.">
				<strong>{totalCoins.toLocaleString("vi-VN")} coin</strong>
			</FormField>
			<Flex gap={16} align="start" wrap>
				<FormField
					label="Trạng thái"
					error={errors.is_active}
					helper="Tắt để tạm ẩn gói khỏi user."
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<Switch
						checked={state.is_active}
						onChange={(v) => set("is_active", v)}
						checkedChildren="Đang bán"
						unCheckedChildren="Tạm ẩn"
					/>
				</FormField>
				<FormField
					label="Best value"
					error={errors.is_best_value}
					helper="Tối đa 1 gói được đánh dấu. Bật ở gói khác sẽ tự tắt ở gói cũ."
					style={{ flex: "1 1 200px", minWidth: 160 }}
				>
					<Switch
						checked={state.is_best_value}
						onChange={(v) => set("is_best_value", v)}
						checkedChildren="Hiện badge"
						unCheckedChildren="Không"
					/>
				</FormField>
			</Flex>
			<Divider style={{ margin: "8px 0 16px" }} />
			<Flex justify="end" gap={8}>
				<Button variant="ghost" onClick={onCancel}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					Lưu
				</Button>
			</Flex>
		</form>
	)
}
