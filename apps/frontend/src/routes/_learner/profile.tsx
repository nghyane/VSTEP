import { LockPasswordIcon, Mail01Icon, UserCircleIcon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { useChangePassword, useUpdateUser, useUser } from "@/hooks/use-user"
import { user } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_learner/profile")({
	component: ProfilePage,
})

function ProfileSection({ userId }: { userId: string }) {
	const { data, isLoading } = useUser(userId)

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
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
			<div
				className={cn(
					"flex size-20 items-center justify-center rounded-full",
					"bg-primary/10 text-3xl font-bold text-primary",
				)}
			>
				{initials}
			</div>
			<div className="space-y-1">
				<h2 className="text-xl font-bold">{data.fullName ?? "Chưa đặt tên"}</h2>
				<p className="text-sm text-muted-foreground">{data.email}</p>
				<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
					Người học
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

	const [fullName, setFullName] = useState(data?.fullName ?? "")
	const [email, setEmail] = useState(data?.email ?? "")

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
					<label htmlFor="fullName" className="flex items-center gap-1.5 text-sm font-medium">
						<HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" />
						Họ và tên
					</label>
					<input
						id="fullName"
						type="text"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
						className={cn(
							"w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
							"focus:outline-none focus:ring-2 focus:ring-ring",
						)}
					/>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
						<HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" />
						Email
					</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={cn(
							"w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
							"focus:outline-none focus:ring-2 focus:ring-ring",
						)}
					/>
				</div>

				{update.isSuccess && <p className="text-sm text-green-600">Đã cập nhật thông tin</p>}
				{update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}

				<Button type="submit" disabled={update.isPending}>
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

	const inputClass = cn(
		"w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
		"focus:outline-none focus:ring-2 focus:ring-ring",
	)

	return (
		<div className="rounded-2xl bg-muted/30 p-6">
			<div className="mb-5 flex items-center gap-2">
				<HugeiconsIcon icon={LockPasswordIcon} className="size-5 text-primary" />
				<h3 className="text-lg font-bold">Đổi mật khẩu</h3>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<label htmlFor="currentPw" className="text-sm font-medium">
						Mật khẩu hiện tại
					</label>
					<input
						id="currentPw"
						type="password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className={inputClass}
					/>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="newPw" className="text-sm font-medium">
						Mật khẩu mới
					</label>
					<input
						id="newPw"
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className={inputClass}
					/>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="confirmPw" className="text-sm font-medium">
						Xác nhận mật khẩu mới
					</label>
					<input
						id="confirmPw"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className={inputClass}
					/>
				</div>

				{validationError && <p className="text-sm text-destructive">{validationError}</p>}
				{changePw.isSuccess && <p className="text-sm text-green-600">Đã đổi mật khẩu thành công</p>}
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
