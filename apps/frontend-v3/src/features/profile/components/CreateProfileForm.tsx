import { useForm } from "@tanstack/react-form"
import { createPortal } from "react-dom"
import { ScrollArea } from "#/components/ScrollArea"
import { DatePicker } from "#/features/auth/DatePicker"
import { inputClass } from "#/features/auth/styles"
import { cn } from "#/lib/utils"
import {
	availableTargets,
	computeMinDate,
	ENTRY_LEVELS,
	type EntryLevel,
	LEVEL_RANK,
	minPrepMonths,
	TARGET_LEVEL_INFO,
	type TargetLevel,
} from "#/lib/vstep"

interface Props {
	onSubmit: (data: {
		nickname: string
		entry_level: string
		target_level: string
		target_deadline: string
	}) => Promise<unknown>
	onCancel: () => void
}

export function CreateProfileForm({ onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: {
			nickname: "",
			entry_level: "A2" as EntryLevel,
			target_level: "B2" as TargetLevel,
			target_deadline: "",
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value)
		},
	})

	if (typeof document === "undefined") return null

	return createPortal(
		<div
			role="presentation"
			onClick={onCancel}
			onKeyDown={(e) => e.key === "Escape" && onCancel()}
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_200ms_ease-out]"
		>
			<form
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				onSubmit={(e) => {
					e.preventDefault()
					void form.handleSubmit()
				}}
				className="card relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface text-left overflow-hidden animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
			>
				<button
					type="button"
					onClick={onCancel}
					aria-label="Đóng"
					className="absolute top-4 right-4 size-8 rounded-full hover:bg-background flex items-center justify-center text-muted transition z-10"
				>
					<span className="text-xl leading-none">×</span>
				</button>

				<form.Field name="nickname">
					{(field) => (
						<div className="shrink-0 bg-gradient-to-b from-primary-tint to-transparent px-6 pt-8 pb-6 text-center">
							<div className="size-20 mx-auto mb-3 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display text-4xl shadow-lg">
								{field.state.value.charAt(0).toUpperCase() || "?"}
							</div>
							<h3 className="font-extrabold text-xl text-foreground">Tạo mục tiêu mới</h3>
							<p className="text-xs text-subtle mt-1">Mỗi mục tiêu là một lộ trình riêng</p>
						</div>
					)}
				</form.Field>

				<ScrollArea className="flex-1 min-h-0" maxHeight="calc(92vh - 16rem)">
					<div className="px-6 pb-2 space-y-5">
						<form.Field name="nickname">
							{(field) => (
								<div className="space-y-1">
									<label htmlFor="create-nickname" className="text-xs font-bold text-muted uppercase">
										Nickname
									</label>
									<input
										id="create-nickname"
										type="text"
										placeholder="VD: Mục tiêu B2 tháng 6"
										required
										maxLength={32}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className={inputClass}
									/>
									<p className="text-[11px] text-subtle">Tên hiển thị trên hồ sơ — tối đa 32 ký tự</p>
								</div>
							)}
						</form.Field>

						<form.Field name="entry_level">
							{(field) => (
								<div className="space-y-2">
									<p className="text-xs font-bold text-muted uppercase">Trình độ hiện tại (tự đánh giá)</p>
									<div className="grid grid-cols-5 gap-2">
										{ENTRY_LEVELS.map((l) => {
											const isActive = field.state.value === l
											return (
												<button
													key={l}
													type="button"
													onClick={() => {
														field.handleChange(l)
														form.setFieldValue("target_deadline", "")
														const targetVal = form.state.values.target_level
														if (LEVEL_RANK[targetVal] < LEVEL_RANK[l]) {
															const fallback = availableTargets(l)[0]
															if (fallback) form.setFieldValue("target_level", fallback)
														}
													}}
													className={cn(
														"h-11 rounded-(--radius-button) font-bold text-sm border-2 border-b-4 transition",
														isActive
															? "bg-primary text-primary-foreground border-primary-dark"
															: "bg-surface border-border text-foreground hover:border-primary/40",
													)}
												>
													{l}
												</button>
											)
										})}
									</div>
									<p className="text-[11px] text-subtle">
										Dùng để gợi ý lộ trình ban đầu. "Dự đoán" sẽ tự cập nhật sau khi làm đủ 5 bài thi thử.
									</p>
								</div>
							)}
						</form.Field>

						<form.Field name="target_level">
							{(field) => (
								<form.Subscribe selector={(s) => s.values.entry_level}>
									{(entry) => {
										const targets = availableTargets(entry)
										return (
											<div className="space-y-2">
												<p className="text-xs font-bold text-muted uppercase">Mục tiêu trình độ</p>
												<div
													className="grid gap-2"
													style={{ gridTemplateColumns: `repeat(${targets.length}, minmax(0, 1fr))` }}
												>
													{targets.map((l) => {
														const isActive = field.state.value === l
														return (
															<button
																key={l}
																type="button"
																onClick={() => {
																	field.handleChange(l)
																	form.setFieldValue("target_deadline", "")
																}}
																className={cn(
																	"relative h-14 rounded-(--radius-button) font-bold text-lg border-2 border-b-4 transition",
																	isActive
																		? "bg-primary text-primary-foreground border-primary-dark"
																		: "bg-surface border-border text-foreground hover:border-primary/40",
																)}
															>
																{l}
																<span
																	className={cn(
																		"block text-[10px] font-bold mt-[-2px]",
																		isActive ? "text-primary-foreground/80" : "text-subtle",
																	)}
																>
																	{TARGET_LEVEL_INFO[l]}
																</span>
															</button>
														)
													})}
												</div>
											</div>
										)
									}}
								</form.Subscribe>
							)}
						</form.Field>

						<form.Field name="target_deadline">
							{(field) => (
								<form.Subscribe selector={(s) => [s.values.entry_level, s.values.target_level] as const}>
									{([entry, target]) => (
										<div className="space-y-2">
											<p className="text-xs font-bold text-muted uppercase">Ngày thi dự kiến</p>
											<p className="text-[11px] text-subtle">
												Tối thiểu {minPrepMonths(entry, target)} tháng để đạt {entry} → {target}.
											</p>
											<DatePicker
												value={field.state.value}
												onChange={field.handleChange}
												minDate={computeMinDate(entry, target)}
											/>
										</div>
									)}
								</form.Subscribe>
							)}
						</form.Field>
					</div>
				</ScrollArea>

				<div className="shrink-0 flex gap-3 px-6 py-4 border-t border-border bg-surface">
					<button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
						Hủy
					</button>
					<form.Subscribe selector={(s) => [s.isSubmitting, s.values.target_deadline] as const}>
						{([isSubmitting, deadline]) => (
							<button
								type="submit"
								disabled={isSubmitting || !deadline}
								className={cn(
									"btn btn-primary flex-1",
									(isSubmitting || !deadline) && "opacity-50 cursor-not-allowed",
								)}
							>
								{isSubmitting ? "Đang tạo..." : "Tạo mục tiêu"}
							</button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>,
		document.body,
	)
}
