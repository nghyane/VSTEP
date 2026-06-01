import { LockPasswordIcon, Mail01Icon, UserCircleIcon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import { AvatarUpload } from "@/components/common/AvatarUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"
import { useChangePassword, useUpdateUser, useUploadAvatar, useUser } from "@/hooks/use-user"
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

type Tab = "profile" | "password"

const TABS: { key: Tab; label: string; icon: typeof UserCircleIcon }[] = [
	{ key: "profile", label: "Hồ sơ", icon: UserCircleIcon },
	{ key: "password", label: "Đổi mật khẩu", icon: LockPasswordIcon },
]

function ProfilePage() {
	const u = user()
	const [tab, setTab] = useState<Tab>("profile")

	if (!u) {
		return <p className="py-10 text-center text-muted-foreground">Chưa đăng nhập</p>
	}

	return (
		<div className="mx-auto max-w-4xl">
			<h1 className="mb-6 text-2xl font-bold">Hồ sơ cá nhân</h1>
			<div className="flex flex-col gap-6 md:flex-row">
				{/* Sidebar */}
				<nav className="w-full shrink-0 md:w-56">
					<div className="rounded-2xl border border-border bg-background p-2">
						{TABS.map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setTab(t.key)}
								className={cn(
									"flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
									tab === t.key
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								)}
							>
								<HugeiconsIcon icon={t.icon} className="size-4" />
								{t.label}
							</button>
						))}
					</div>
				</nav>

				{/* Content */}
				<div className="min-w-0 flex-1 rounded-2xl border border-border bg-background">
					{tab === "profile" && <ProfileTab userId={u.id} />}
					{tab === "password" && <PasswordTab userId={u.id} />}
				</div>
			</div>
		</div>
	)
}

function ProfileTab({ userId }: { userId: string }) {
	const { data, isLoading, isError, error } = useUser(userId)
	const uploadAvatar = useUploadAvatar(userId)
	const update = useUpdateUser(userId)

	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")

	useEffect(() => {
		if (data) {
			setFullName(data.fullName ?? "")
			setEmail(data.email ?? "")
		}
	}, [data])

	if (isLoading) {
		return <p className="p-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (isError) {
		return <p className="p-10 text-center text-destructive">{error.message}</p>
	}

	if (!data) return null

	const hasChanges = fullName !== (data.fullName ?? "") || email !== (data.email ?? "")

	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		update.mutate({ fullName, email })
	}

	return (
		<div className="p-6">
			<h2 className="text-lg font-bold">Hồ sơ</h2>
			<Separator className="my-4" />

			{/* Avatar section */}
			<div className="mb-8 flex items-center gap-5">
				<AvatarUpload
					avatarKey={data.avatarKey}
					fullName={data.fullName}
					email={data.email}
					isPending={uploadAvatar.isPending}
					onUpload={(blob) => uploadAvatar.mutate(blob)}
					className="size-20"
				/>
				<div className="space-y-1">
					<h3 className="text-lg font-bold">{data.fullName ?? "Chưa đặt tên"}</h3>
					<p className="text-sm text-muted-foreground">{data.email}</p>
					<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
						{ROLE_LABELS[data.role] ?? data.role}
					</span>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="grid gap-5 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="fullName" className="flex items-center gap-1.5">
							<HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" />
							Họ và tên <span className="text-destructive">*</span>
						</Label>
						<Input
							id="fullName"
							type="text"
							placeholder="Nhập họ và tên"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="email" className="flex items-center gap-1.5">
							<HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" />
							Email <span className="text-destructive">*</span>
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="Nhập email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
				</div>

				{update.isSuccess && <p className="text-sm text-success">Đã cập nhật thông tin</p>}
				{update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}

				<div className="flex justify-end">
					<Button type="submit" disabled={update.isPending || !hasChanges}>
						{update.isPending ? "Đang lưu..." : "Lưu"}
					</Button>
				</div>
			</form>
		</div>
	)
}

function PasswordTab({ userId }: { userId: string }) {
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
		<div className="p-6">
			<h2 className="text-lg font-bold">Đổi mật khẩu</h2>
			<Separator className="my-4" />

			<form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
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

				<div className="flex justify-end">
					<Button type="submit" disabled={changePw.isPending}>
						{changePw.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
					</Button>
				</div>
			</form>
		</div>
	)
}
