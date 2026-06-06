import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Empty, Flex, Tag, Typography } from "antd"
import { useEffect, useMemo, useState } from "react"
import { Button } from "#/components/Button"
import { Input } from "#/components/Input"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { profileSearchQuery, useCreateEnrollment } from "#/features/admin-courses/queries"
import type { ProfilePickerItem, UserPickerResult } from "#/features/admin-courses/types"
import { extractError } from "#/lib/api"

interface Props {
	open: boolean
	onClose: () => void
	courseId: string
}

const MIN_QUERY_LEN = 2

export function AddEnrollmentDialog({ open, onClose, courseId }: Props) {
	const [input, setInput] = useState("")
	const [q, setQ] = useState("")
	const [pickedProfileId, setPickedProfileId] = useState<string | null>(null)

	useEffect(() => {
		if (!open) {
			setInput("")
			setQ("")
			setPickedProfileId(null)
		}
	}, [open])

	useEffect(() => {
		const t = setTimeout(() => setQ(input.trim()), 300)
		return () => clearTimeout(t)
	}, [input])

	const queryReady = q.length >= MIN_QUERY_LEN
	const { data, isFetching } = useQuery({
		...profileSearchQuery(q, courseId),
		enabled: open && queryReady,
	})
	const users = data?.data ?? []

	const allProfiles = useMemo(() => users.flatMap((u) => u.profiles), [users])
	const picked = useMemo(
		() => (pickedProfileId ? (allProfiles.find((p) => p.id === pickedProfileId) ?? null) : null),
		[pickedProfileId, allProfiles],
	)

	// Auto-expand: chỉ có 1 user kết quả → mở luôn để admin chọn ngay.
	// Còn lại: tất cả collapsed; admin click vào user để expand.
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const onlyUserId = users.length === 1 ? users[0].id : null
	useEffect(() => {
		setExpanded(onlyUserId ? new Set([onlyUserId]) : new Set())
	}, [onlyUserId])

	function toggleUser(id: string): void {
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const create = useCreateEnrollment(courseId)

	async function onAdd(): Promise<void> {
		if (!pickedProfileId) return
		try {
			await create.mutateAsync(pickedProfileId)
			showSuccess("Đã thêm học viên vào khóa.")
			onClose()
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Thêm học viên vào khóa"
			description="Tìm theo email, tên, hoặc nickname rồi chọn 1 profile."
			size="lg"
		>
			<Flex vertical gap={12}>
				<Input
					autoFocus
					placeholder={`Nhập tối thiểu ${MIN_QUERY_LEN} ký tự (email / tên / nickname)...`}
					value={input}
					onChange={(e) => setInput(e.target.value)}
				/>

				<div
					style={{
						maxHeight: 360,
						overflowY: "auto",
						border: "1px solid #f0f0f0",
						borderRadius: 8,
					}}
				>
					{!queryReady ? (
						<HintState text={`Nhập ${MIN_QUERY_LEN} ký tự trở lên để tìm học viên.`} />
					) : isFetching && users.length === 0 ? (
						<HintState text="Đang tìm..." />
					) : users.length === 0 ? (
						<div style={{ padding: 24 }}>
							<Empty description="Không tìm thấy học viên phù hợp." />
						</div>
					) : (
						<Flex vertical>
							{users.map((u) => (
								<UserBlock
									key={u.id}
									user={u}
									expanded={expanded.has(u.id)}
									onToggle={() => toggleUser(u.id)}
									pickedProfileId={pickedProfileId}
									onPickProfile={setPickedProfileId}
								/>
							))}
						</Flex>
					)}
				</div>

				<Flex justify="space-between" align="center" gap={8}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{picked
							? `Đã chọn: ${picked.nickname ?? "(chưa đặt nickname)"}${picked.target_level ? ` · ${picked.target_level}` : ""}`
							: ""}
					</Typography.Text>
					<Flex gap={8}>
						<Button variant="ghost" onClick={onClose} disabled={create.isPending}>
							Huỷ
						</Button>
						<Button
							onClick={onAdd}
							disabled={!pickedProfileId || create.isPending}
							loading={create.isPending}
						>
							Thêm vào khóa
						</Button>
					</Flex>
				</Flex>
			</Flex>
		</Modal>
	)
}

function HintState({ text }: { text: string }) {
	return (
		<div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(0,0,0,0.45)", fontSize: 13 }}>
			{text}
		</div>
	)
}

function UserBlock({
	user,
	expanded,
	onToggle,
	pickedProfileId,
	onPickProfile,
}: {
	user: UserPickerResult
	expanded: boolean
	onToggle: () => void
	pickedProfileId: string | null
	onPickProfile: (id: string) => void
}) {
	const hasName = !!user.display_name?.trim()
	const profileCount = user.profiles.length
	// Hightlight nếu profile đang chọn thuộc user này.
	const containsPicked = user.profiles.some((p) => p.id === pickedProfileId)

	return (
		<div style={{ borderBottom: "1px solid #f0f0f0" }}>
			<button
				type="button"
				onClick={onToggle}
				style={{
					display: "flex",
					width: "100%",
					alignItems: "center",
					gap: 8,
					padding: "10px 16px",
					background: containsPicked ? "#e6f4ff" : "#fafafa",
					border: 0,
					cursor: "pointer",
					textAlign: "left",
				}}
			>
				<span style={{ color: "rgba(0,0,0,0.45)", display: "inline-flex", width: 14 }}>
					{expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
				</span>
				<Flex justify="space-between" align="center" gap={8} style={{ flex: 1 }}>
					<Flex vertical gap={2} style={{ minWidth: 0 }}>
						{hasName ? (
							<>
								<strong style={{ fontSize: 14 }}>{user.display_name}</strong>
								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									{user.email}
								</Typography.Text>
							</>
						) : (
							<strong style={{ fontSize: 14 }}>{user.email}</strong>
						)}
					</Flex>
					<Tag color="default" style={{ marginInlineEnd: 0 }}>
						{profileCount} profile
					</Tag>
				</Flex>
			</button>
			{expanded &&
				(profileCount === 0 ? (
					<div style={{ padding: "8px 16px 12px 38px", color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
						Người dùng chưa có profile nào.
					</div>
				) : (
					user.profiles.map((p) => (
						<ProfileRow
							key={p.id}
							profile={p}
							selected={pickedProfileId === p.id}
							onSelect={() => onPickProfile(p.id)}
						/>
					))
				))}
		</div>
	)
}

function ProfileRow({
	profile,
	selected,
	onSelect,
}: {
	profile: ProfilePickerItem
	selected: boolean
	onSelect: () => void
}) {
	const disabled = profile.is_enrolled
	return (
		<button
			type="button"
			onClick={() => !disabled && onSelect()}
			disabled={disabled}
			style={{
				display: "flex",
				width: "100%",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 8,
				padding: "8px 16px 8px 32px",
				background: selected ? "#e6f4ff" : "transparent",
				border: 0,
				borderTop: "1px solid #fafafa",
				cursor: disabled ? "not-allowed" : "pointer",
				opacity: disabled ? 0.55 : 1,
				textAlign: "left",
			}}
		>
			<span style={{ fontSize: 13 }}>{profile.nickname || "(chưa đặt nickname)"}</span>
			<Flex gap={4} align="center">
				{profile.target_level && (
					<Tag color="blue" style={{ marginInlineEnd: 0 }}>
						{profile.target_level}
					</Tag>
				)}
				{profile.is_enrolled && (
					<Tag color="default" style={{ marginInlineEnd: 0 }}>
						Đã ghi danh
					</Tag>
				)}
			</Flex>
		</button>
	)
}
