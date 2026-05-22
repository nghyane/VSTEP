import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input, PasswordInput } from "#/components/Input"
import { Select } from "#/components/Select"
import { Textarea } from "#/components/Textarea"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import {
	type AdminUser,
	CREATABLE_ROLES,
	type CreatableRole,
	type CreateUserInput,
	ROLE_LABELS,
	type UpdateUserInput,
} from "./types"

interface CreateProps {
	mode: "create"
	onSubmit: (input: CreateUserInput) => Promise<void>
	onCancel: () => void
	submitting: boolean
}

interface EditProps {
	mode: "edit"
	initial: AdminUser
	onSubmit: (input: UpdateUserInput) => Promise<void>
	onCancel: () => void
	submitting: boolean
}

type Props = CreateProps | EditProps

interface FormState {
	email: string
	password: string
	role: CreatableRole
	full_name: string
	title: string
	bio: string
}

export function UserForm(props: Props) {
	const isEdit = props.mode === "edit"
	const initial = isEdit ? props.initial : null

	const [state, setState] = useState<FormState>({
		email: initial?.email ?? "",
		password: "",
		role: (initial && (CREATABLE_ROLES as readonly string[]).includes(initial.role)
			? (initial.role as CreatableRole)
			: "learner") satisfies CreatableRole,
		full_name: initial?.full_name ?? "",
		title: initial?.title ?? "",
		bio: initial?.bio ?? "",
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof FormState>(k: K, v: FormState[K]): void {
		setState((s) => ({ ...s, [k]: v }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			if (isEdit) {
				await props.onSubmit({
					full_name: state.full_name || null,
					title: state.title || null,
					bio: state.bio || null,
				})
			} else {
				await props.onSubmit({
					email: state.email,
					password: state.password,
					role: state.role,
					full_name: state.full_name || null,
					title: state.title || null,
					bio: state.bio || null,
				})
			}
		} catch (err) {
			const x = await extractError(err)
			if (x.errors && Object.keys(x.errors).length > 0) {
				setErrors(x.errors)
			}
			setGeneric(formatApiErrorBanner(x))
		}
	}

	// Title/bio chỉ relevant cho teacher; ở edit mode giữ field vì admin
	// có thể đã set sẵn lúc create. Ở create mode hiện khi role=teacher.
	const showTeacherFields = isEdit ? initial?.role === "teacher" : state.role === "teacher"

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				{generic && <Alert type="error" message={generic} showIcon style={{ marginBottom: 12 }} closable />}
				{isEdit && (
					<Alert
						type="info"
						showIcon
						message="Email và phân quyền (role) không thể đổi sau khi tạo."
						style={{ marginBottom: 12 }}
					/>
				)}

				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Email" htmlFor="email" required error={errors.email}>
							<Input
								id="email"
								type="email"
								value={state.email}
								onChange={(e) => set("email", e.target.value)}
								invalid={!!errors.email}
								disabled={isEdit}
								placeholder="user@example.com"
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Phân quyền" htmlFor="role" required error={errors.role}>
							<Select
								id="role"
								value={state.role}
								onChange={(e) => set("role", e.target.value as CreatableRole)}
								disabled={isEdit}
							>
								{CREATABLE_ROLES.map((r) => (
									<option key={r} value={r}>
										{ROLE_LABELS[r]}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
				</Row>

				{!isEdit && (
					<FormField
						label="Mật khẩu khởi tạo"
						htmlFor="password"
						required
						error={errors.password}
						helper="Tối thiểu 8 ký tự. Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên."
					>
						<PasswordInput
							id="password"
							value={state.password}
							onChange={(e) => set("password", e.target.value)}
							invalid={!!errors.password}
							autoComplete="new-password"
						/>
					</FormField>
				)}

				<FormField label="Họ và tên" htmlFor="full_name" error={errors.full_name}>
					<Input
						id="full_name"
						value={state.full_name}
						onChange={(e) => set("full_name", e.target.value)}
						invalid={!!errors.full_name}
					/>
				</FormField>

				{showTeacherFields && (
					<>
						<FormField
							label="Học vị / chức danh"
							htmlFor="title"
							error={errors.title}
							helper="VD: Tiến sĩ Ngôn ngữ Anh · VSTEP C1"
						>
							<Input
								id="title"
								value={state.title}
								onChange={(e) => set("title", e.target.value)}
								invalid={!!errors.title}
							/>
						</FormField>
						<FormField label="Giới thiệu" htmlFor="bio" error={errors.bio}>
							<Textarea
								id="bio"
								value={state.bio}
								onChange={(e) => set("bio", e.target.value)}
								rows={3}
								invalid={!!errors.bio}
							/>
						</FormField>
					</>
				)}

				<Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
					<Button variant="ghost" onClick={props.onCancel} disabled={props.submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={props.submitting}>
						{isEdit ? "Cập nhật" : "Tạo người dùng"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
