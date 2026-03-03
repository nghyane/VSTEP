import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCreateUser } from "@/hooks/use-admin-users"

type Role = "admin" | "instructor" | "learner"

const inputCls =
	"h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"

export function CreateUserForm({ onDone }: { onDone: () => void }) {
	const createUser = useCreateUser()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [fullName, setFullName] = useState("")
	const [role, setRole] = useState<Role>("learner")

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		createUser.mutate(
			{ email, password, fullName: fullName || undefined, role },
			{ onSuccess: () => onDone() },
		)
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-muted/30 p-4"
		>
			<label className="grid gap-1">
				<span className="text-xs text-muted-foreground">Email</span>
				<input
					required
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1">
				<span className="text-xs text-muted-foreground">Mật khẩu</span>
				<input
					required
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1">
				<span className="text-xs text-muted-foreground">Họ tên</span>
				<input
					type="text"
					value={fullName}
					onChange={(e) => setFullName(e.target.value)}
					className={inputCls}
				/>
			</label>
			<label className="grid gap-1">
				<span className="text-xs text-muted-foreground">Vai trò</span>
				<select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
					<option value="learner">Learner</option>
					<option value="instructor">Instructor</option>
					<option value="admin">Admin</option>
				</select>
			</label>
			<Button type="submit" disabled={createUser.isPending}>
				{createUser.isPending ? "Đang tạo..." : "Tạo"}
			</Button>
			<Button type="button" variant="ghost" onClick={onDone}>
				Hủy
			</Button>
		</form>
	)
}
