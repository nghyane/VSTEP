import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Header } from "#/components/Header"
import { appConfigQuery } from "#/features/config/queries"
import { ChangePasswordDialog } from "#/features/profile/components/ChangePasswordDialog"
import { CreateProfileForm } from "#/features/profile/components/CreateProfileForm"
import { EditProfileForm } from "#/features/profile/components/EditProfileForm"
import { useAvatarPicker } from "#/features/profile/use-avatar-picker"
import { useProfilePage } from "#/features/profile/use-profile-page"
import { PromoRedeemCard } from "#/features/wallet/PromoRedeemCard"
import { AVATAR_PRESETS, getAvatarUrl, getProfileAvatarSrc } from "#/lib/avatar"
import { cn } from "#/lib/utils"
import type { Profile } from "#/types/auth"

export const Route = createFileRoute("/_app/ho-so")({
	validateSearch: (s: Record<string, unknown>): { edit?: boolean } => {
		return s.edit ? { edit: true } : {}
	},
	component: ProfilePage,
})

function daysUntil(deadline: string): number {
	const diff = new Date(deadline).getTime() - Date.now()
	return Math.max(0, Math.ceil(diff / 86400000))
}

function ProfilePage() {
	const { edit } = Route.useSearch()
	const p = useProfilePage(edit)
	const config = useQuery(appConfigQuery)
	const [showChangePassword, setShowChangePassword] = useState(false)

	if (p.isLoading || config.isLoading || !p.profiles || !config.data) return <Header title="Hồ sơ" />
	const maxProfiles = config.data.data.profile.max_profiles_per_account
	const canCreateProfile = p.profiles.length < maxProfiles

	return (
		<>
			<Header title="Hồ sơ" />
			<div className="px-10 pb-12 space-y-10">
				{/* Profile selector — Netflix style */}
				<section className="text-center">
					<h3 className="font-extrabold text-2xl text-foreground mb-1">Mục tiêu của bạn</h3>
					<p className="text-sm text-subtle mb-2">Mỗi mục tiêu là một lộ trình luyện tập riêng</p>
					<p className="text-xs font-bold text-subtle mb-8">
						{p.profiles.length}/{maxProfiles} hồ sơ
					</p>

					<div className="flex flex-wrap items-start justify-center gap-6">
						{p.profiles.map((prof) => (
							<ProfileAvatar
								key={prof.id}
								profile={prof}
								isActive={prof.id === p.activeProfile.id}
								onSwitch={() => p.requestSwitch(prof)}
								onEdit={() => p.setEditing(prof)}
							/>
						))}

						{/* Add new */}
						{!p.showCreate && canCreateProfile && (
							<button
								type="button"
								onClick={() => p.setShowCreate(true)}
								className="group flex flex-col items-center gap-3 w-[140px]"
							>
								<div className="size-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary-tint group-hover:scale-105">
									<span className="text-3xl text-subtle group-hover:text-primary transition-colors">+</span>
								</div>
								<span className="text-sm font-bold text-muted group-hover:text-foreground transition-colors">
									Mục tiêu mới
								</span>
							</button>
						)}
					</div>
					{!canCreateProfile && (
						<p className="mt-6 text-xs font-bold text-subtle">
							Bạn đã đạt giới hạn {maxProfiles} hồ sơ. Hãy xoá hồ sơ không dùng hoặc liên hệ hỗ trợ nếu cần
							tạo thêm.
						</p>
					)}
				</section>

				{/* Forms */}
				{p.showCreate && (
					<CreateProfileForm onSubmit={p.handleCreate} onCancel={() => p.setShowCreate(false)} />
				)}
				{p.editing && (
					<EditProfileForm profile={p.editing} onSubmit={p.handleUpdate} onCancel={p.closeEdit} />
				)}

				<ConfirmDialog
					open={!!p.pendingSwitch}
					title="Chuyển hồ sơ?"
					description={
						p.pendingSwitch ? (
							<>
								Bạn sắp chuyển sang hồ sơ <strong>{p.pendingSwitch.nickname}</strong> (mục tiêu{" "}
								{p.pendingSwitch.target_level}). Toàn bộ tiến trình luyện tập sẽ áp dụng cho hồ sơ này.
							</>
						) : (
							""
						)
					}
					confirmLabel="Chuyển hồ sơ"
					cancelLabel="Huỷ"
					loadingLabel="Đang chuyển…"
					isLoading={p.doSwitch.isPending}
					onConfirm={p.confirmSwitch}
					onCancel={p.cancelSwitch}
				/>

				<PromoRedeemCard />

				{/* Account */}
				<section className="card p-6">
					<h3 className="font-bold text-base text-foreground mb-4">Tài khoản</h3>
					<div className="flex items-center justify-between py-3 border-t border-border">
						<span className="text-sm text-muted">Email</span>
						<span className="text-sm font-bold text-foreground">{p.user.email}</span>
					</div>
					<div className="flex items-center justify-between gap-4 py-3 border-t border-border">
						<div className="min-w-0">
							<p className="text-sm text-muted">Mật khẩu</p>
							<p className="text-xs text-subtle mt-0.5">
								{!p.user.has_password
									? "Bạn đăng nhập bằng Google — mật khẩu do Google quản lý."
									: "Đổi mật khẩu định kỳ để bảo vệ tài khoản."}
							</p>
						</div>
						{!p.user.has_password ? (
							<a
								href="https://myaccount.google.com/security"
								target="_blank"
								rel="noreferrer"
								className="btn btn-secondary text-sm font-bold px-4 py-2 whitespace-nowrap"
							>
								Mở Google
							</a>
						) : (
							<button
								type="button"
								onClick={() => setShowChangePassword(true)}
								className="btn btn-secondary text-sm font-bold px-4 py-2 whitespace-nowrap"
							>
								Đổi mật khẩu
							</button>
						)}
					</div>
					<div className="pt-4 border-t border-border mt-3">
						<AvatarPickerSection />
					</div>
				</section>
			</div>

			<ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
		</>
	)
}

function AvatarPickerSection() {
	const p = useAvatarPicker()
	if (!p.user || !p.profile) return null

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) p.selectFile(file)
		e.target.value = ""
	}

	return (
		<div className="space-y-4">
			<p className="text-sm font-bold text-foreground">Ảnh đại diện</p>
			<AvatarPreview
				user={p.user}
				src={p.currentSrc}
				isPending={p.isPending}
				pendingFile={p.pendingFile}
				onFileChange={handleFileChange}
			/>
			<AvatarPresetGrid picker={p} />
		</div>
	)
}

function AvatarPreview({
	user,
	src,
	isPending,
	pendingFile,
	onFileChange,
}: {
	user: { email: string }
	src: string | null
	isPending: boolean
	pendingFile: File | null
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
	return (
		<div className="flex items-center gap-4">
			<div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
				{src ? (
					<img src={src} alt="Avatar" className="w-full h-full object-cover" />
				) : (
					<span className="text-2xl font-extrabold text-primary">{user.email.charAt(0).toUpperCase()}</span>
				)}
			</div>
			<div className="space-y-1.5">
				<label
					className={cn(
						"inline-flex items-center gap-2 px-3 py-1.5 rounded-(--radius-button) border-2 border-b-4 border-border text-xs font-bold text-foreground cursor-pointer transition hover:border-primary/40",
						isPending && "opacity-50 pointer-events-none",
					)}
				>
					<input
						type="file"
						accept="image/jpg,image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={onFileChange}
					/>
					{pendingFile ? pendingFile.name : "Tải ảnh lên"}
				</label>
				<p className="text-[11px] text-muted">JPG, PNG, WebP · tối đa 2MB</p>
			</div>
		</div>
	)
}

function AvatarPresetGrid({ picker }: { picker: ReturnType<typeof useAvatarPicker> }) {
	return (
		<div>
			<button
				type="button"
				onClick={picker.togglePresets}
				className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-2"
			>
				{picker.showPresets ? "▲" : "▼"} Hoặc chọn avatar có sẵn
			</button>
			{picker.showPresets && (
				<div className="grid grid-cols-6 gap-2">
					{AVATAR_PRESETS.map((preset) => {
						const isActive =
							picker.pendingKey === preset.key ||
							(picker.profile?.avatar_key === preset.key && !picker.profile?.avatar_url && !picker.pendingKey)
						return (
							<button
								key={preset.key}
								type="button"
								onClick={() => picker.selectPreset(preset.key)}
								disabled={picker.isPending}
								title={preset.key}
								className={cn(
									"flex items-center justify-center p-1.5 rounded-(--radius-card) border-2 transition",
									isActive
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/40 hover:bg-primary/5",
								)}
							>
								<img
									src={getAvatarUrl(preset.key)}
									alt={preset.key}
									className="w-12 h-12 rounded-full object-cover"
								/>
							</button>
						)
					})}
				</div>
			)}
			{picker.isDirty && (
				<div className="flex items-center gap-2 mt-3">
					<button
						type="button"
						onClick={picker.save}
						disabled={picker.isPending}
						className="px-4 py-1.5 rounded-(--radius-button) bg-primary text-primary-foreground text-xs font-bold shadow-[0_3px_0_var(--color-primary-dark)] active:shadow-[0_1px_0_var(--color-primary-dark)] active:translate-y-[2px] transition disabled:opacity-50"
					>
						{picker.isPending ? "Đang lưu..." : "Lưu"}
					</button>
					<button
						type="button"
						onClick={picker.cancel}
						disabled={picker.isPending}
						className="px-4 py-1.5 rounded-(--radius-button) border-2 border-border text-xs font-bold text-muted hover:text-foreground transition"
					>
						Huỷ
					</button>
				</div>
			)}
		</div>
	)
}

function ProfileAvatar({
	profile,
	isActive,
	onSwitch,
	onEdit,
}: {
	profile: Profile
	isActive: boolean
	onSwitch: () => void
	onEdit: () => void
}) {
	const avatarSrc = getProfileAvatarSrc(profile)
	const initial = profile.nickname.charAt(0).toUpperCase()
	const level = profile.target_level
	const days = daysUntil(profile.target_deadline)

	return (
		<div className="flex flex-col items-center gap-3 w-[140px]">
			<button
				type="button"
				onClick={onSwitch}
				disabled={isActive}
				className={cn(
					"relative size-24 rounded-2xl bg-primary flex items-center justify-center transition-all duration-200 border-2 border-b-4 border-primary-dark overflow-hidden",
					isActive
						? "ring-4 ring-primary-dark ring-offset-2 ring-offset-surface scale-105"
						: "hover:scale-110 hover:shadow-lg active:scale-100 active:translate-y-[2px] active:border-b-2",
				)}
			>
				{avatarSrc ? (
					<img src={avatarSrc} alt="" className="w-full h-full object-cover" />
				) : (
					<span className="text-white font-display text-3xl">{initial}</span>
				)}

				{/* Level badge */}
				<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-extrabold text-primary-dark bg-surface border-2 border-primary-dark px-2 py-0.5 rounded-full shadow-sm">
					{level}
				</span>
			</button>

			<div className="text-center">
				<p
					className={cn(
						"text-sm font-extrabold truncate max-w-[140px]",
						isActive ? "text-foreground" : "text-muted",
					)}
				>
					{profile.nickname}
				</p>
				<p className="text-[11px] text-subtle mt-0.5">{days > 0 ? `Còn ${days} ngày` : "Đã qua deadline"}</p>
			</div>

			{isActive && (
				<button type="button" onClick={onEdit} className="text-[11px] font-bold text-primary hover:underline">
					Chỉnh sửa
				</button>
			)}
		</div>
	)
}
