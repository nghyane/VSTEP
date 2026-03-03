import { LockPasswordIcon, Mail01Icon, UserCircleIcon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { useChangePassword, useUpdateUser, useUser } from "@/hooks/use-user"
import { user } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_learner/profile")({
	component: ProfilePage,
})

const ROLE_LABELS: Record<string, string> = {
	learner: "Người học",
	instructor: "Giảng viên",
	admin: "Quản trị viên",
}

function ProfileSection({ userId }: { userId: string }) {
	const { data, isLoading, isError, error } = useUser(userId)

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (isError) {
		return <p className="py-10 text-center text-destructive">{error.message}</p>
	}

	if (!data) return null

	const initials = (data.fullName ?? data.email)
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()

	return (
		<div className="flex items-center gap-6">
			<Avatar className={cn("size-20")}>
				<AvatarFallback className={cn("bg-primary/10 text-3xl font-bold text-primary")}>
					{initials}
				</AvatarFallback>
			</Avatar>
			<div className="space-y-1">
				<h2 className="text-xl font-bold">{data.fullName ?? "Chưa đặt tên"}</h2>
				<p className="text-sm text-muted-foreground">{data.email}</p>
				<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
					{ROLE_LABELS[data.role] ?? data.role}
				</span>
				<p className="text-xs text-muted-foreground">
					Thành viên từ {new Date(data.createdAt).toLocaleDateString("vi-VN")}
				</p>
			</div>
		</div>
	)
}

function UpdateInfoForm({ userId }: { userId: string }) {
	const { data } = useUser(userId)
	const update = useUpdateUser(userId)

	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")

	useEffect(() => {
		if (data) {
			setFullName(data.fullName ?? "")
			setEmail(data.email ?? "")
		}
	}, [data])

	const hasChanges = fullName !== (data?.fullName ?? "") || email !== (data?.email ?? "")

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		update.mutate({ fullName, email })
	}

	return (
		<div className="rounded-2xl bg-muted/30 p-6">
			<div className="mb-5 flex items-center gap-2">
				<HugeiconsIcon icon={UserCircleIcon} className="size-5 text-primary" />
				<h3 className="text-lg font-bold">Cập nhật thông tin</h3>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="fullName" className="flex items-center gap-1.5">
						<HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" />
						Họ và tên
					</Label>
					<Input
						id="fullName"
						type="text"
						placeholder={data?.fullName ?? "Nhập họ và tên"}
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="email" className="flex items-center gap-1.5">
						<HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" />
						Email
					</Label>
					<Input
						id="email"
						type="email"
						placeholder={data?.email ?? "Nhập email"}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>

				{update.isSuccess && <p className="text-sm text-success">Đã cập nhật thông tin</p>}
				{update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}

				<Button type="submit" disabled={update.isPending || !hasChanges}>
					{update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
				</Button>
			</form>
		</div>
	)
}

function ChangePasswordForm({ userId }: { userId: string }) {
	const changePw = useChangePassword(userId)

	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [validationError, setValidationError] = useState("")

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		setValidationError("")

		if (newPassword.length < 8) {
			setValidationError("Mật khẩu mới phải có ít nhất 8 ký tự")
			return
		}
		if (newPassword !== confirmPassword) {
			setValidationError("Mật khẩu xác nhận không khớp")
			return
		}

		changePw.mutate(
			{ currentPassword, newPassword },
			{
				onSuccess: () => {
					setCurrentPassword("")
					setNewPassword("")
					setConfirmPassword("")
				},
			},
		)
	}

	return (
		<div className="rounded-2xl bg-muted/30 p-6">
			<div className="mb-5 flex items-center gap-2">
				<HugeiconsIcon icon={LockPasswordIcon} className="size-5 text-primary" />
				<h3 className="text-lg font-bold">Đổi mật khẩu</h3>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="currentPw">Mật khẩu hiện tại</Label>
					<PasswordInput
						id="currentPw"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="newPw">Mật khẩu mới</Label>
					<PasswordInput
						id="newPw"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="confirmPw">Xác nhận mật khẩu mới</Label>
					<PasswordInput
						id="confirmPw"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</div>

				{validationError && <p className="text-sm text-destructive">{validationError}</p>}
				{changePw.isSuccess && <p className="text-sm text-success">Đã đổi mật khẩu thành công</p>}
				{changePw.isError && <p className="text-sm text-destructive">{changePw.error.message}</p>}

				<Button type="submit" disabled={changePw.isPending}>
					{changePw.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
				</Button>
			</form>
		</div>
	)
}

function ProfilePage() {
	const u = user()

	if (!u) {
		return <p className="py-10 text-center text-muted-foreground">Chưa đăng nhập</p>
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8">
			<h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
			<ProfileSection userId={u.id} />
			<UpdateInfoForm userId={u.id} />
			<ChangePasswordForm userId={u.id} />
		</div>
	)
}
