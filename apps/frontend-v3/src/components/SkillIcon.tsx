import { cn } from "#/lib/utils"

/**
 * Plasticine PNG icons từ icons8.com (256px source).
 * Đặt tại `public/icons/{name}.png`. Không qua build pipeline — load runtime qua URL.
 *
 * Quy trình thêm icon mới: xem `.agents/wiki/icon-criteria-icons8.md`.
 */

const SIZES = {
	xs: "h-4 w-auto",
	sm: "h-6 w-auto",
	md: "h-10 w-auto",
	lg: "h-14 w-auto",
	xl: "h-20 w-auto",
} as const

type SkillIconSize = keyof typeof SIZES

export function SkillIcon({
	name,
	size = "md",
	className,
}: {
	name: string
	size?: SkillIconSize
	className?: string
}) {
	return <img src={`/icons/${name}.png`} alt="" className={cn(SIZES[size], className)} />
}
