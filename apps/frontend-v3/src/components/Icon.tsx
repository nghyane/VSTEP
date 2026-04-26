// ?react imports — vite-plugin-svgr

import avatarNodding from "#/assets/icons/avatar-nodding.svg"
import BackIcon from "#/assets/icons/back-small.svg?react"
// Static imports (multi-tone, not currentColor)
import bellSmall from "#/assets/icons/bell-small.svg"
import BookIcon from "#/assets/icons/book-default.svg?react"
import CheckIcon from "#/assets/icons/check-small.svg?react"
import chestMedium from "#/assets/icons/chest-medium.svg"
import chestOpen from "#/assets/icons/chest-open.svg"
import ClipboardIcon from "#/assets/icons/clipboard-small.svg?react"
import CloseIcon from "#/assets/icons/close-small.svg?react"
import coinMedium from "#/assets/icons/coin-medium.svg"
import coinSmall from "#/assets/icons/coin-small.svg"
import CoinSmallIcon from "#/assets/icons/coin-small.svg?react"
import FaceIcon from "#/assets/icons/face-small.svg?react"
import flagSmall from "#/assets/icons/flag-small.svg"
import GraduationIcon from "#/assets/icons/graduation-small.svg?react"
import GuidebookIcon from "#/assets/icons/guidebook-small.svg?react"
import HouseIcon from "#/assets/icons/house-small.svg?react"
import LightningIcon from "#/assets/icons/lightning-small.svg?react"
import LogoutIcon from "#/assets/icons/logout-small.svg?react"
import MicIcon from "#/assets/icons/microphone-small.svg?react"
import challengeMedium from "#/assets/icons/monthly-challenge-medium.svg"
import MoreIcon from "#/assets/icons/more-small.svg?react"
import PencilIcon from "#/assets/icons/pencil-small.svg?react"
import PlayIcon from "#/assets/icons/play-small.svg?react"
import SearchIcon from "#/assets/icons/search-small.svg?react"
import streakLarge from "#/assets/icons/streak-large.svg"
import streakMedium from "#/assets/icons/streak-medium.svg"
import streakSmall from "#/assets/icons/streak-small.svg"
import targetMedium from "#/assets/icons/target-medium.svg"
import TargetSmallIcon from "#/assets/icons/target-small.svg?react"
import timerMedium from "#/assets/icons/timer-medium.svg"
import TimerSmallIcon from "#/assets/icons/timer-small.svg?react"
import TrashIcon from "#/assets/icons/trash-small.svg?react"
import trophySmall from "#/assets/icons/trophy-small.svg"
import VolumeIcon from "#/assets/icons/volume-small.svg?react"
import WeightsIcon from "#/assets/icons/weights-small.svg?react"
import { cn } from "#/lib/utils"

/** Mono-color icons (use currentColor, support dynamic color via style/className) */
export const icons = {
	back: BackIcon,
	book: BookIcon,
	check: CheckIcon,
	clipboard: ClipboardIcon,
	close: CloseIcon,
	"coin-mono": CoinSmallIcon,
	face: FaceIcon,
	graduation: GraduationIcon,
	guidebook: GuidebookIcon,
	house: HouseIcon,
	lightning: LightningIcon,
	logout: LogoutIcon,
	mic: MicIcon,
	more: MoreIcon,
	pencil: PencilIcon,
	play: PlayIcon,
	search: SearchIcon,
	target: TargetSmallIcon,
	timer: TimerSmallIcon,
	trash: TrashIcon,
	volume: VolumeIcon,
	weights: WeightsIcon,
} as const

export type IconName = keyof typeof icons

/** Multi-tone static icons (use as <img src>) */
export const staticIcons = {
	bell: bellSmall,
	chest: chestMedium,
	"chest-open": chestOpen,
	challenge: challengeMedium,
	coin: coinSmall,
	"coin-md": coinMedium,
	flag: flagSmall,
	"streak-sm": streakSmall,
	"streak-md": streakMedium,
	"streak-lg": streakLarge,
	"target-md": targetMedium,
	"timer-md": timerMedium,
	trophy: trophySmall,
	"avatar-nodding": avatarNodding,
} as const

export type StaticIconName = keyof typeof staticIcons

/** Sizes */
const SIZES = {
	xs: "h-4 w-auto",
	sm: "h-6 w-auto",
	md: "h-8 w-auto",
	lg: "h-10 w-auto",
	xl: "h-12 w-auto",
} as const

type IconSize = keyof typeof SIZES

/** Mono-color icon component (supports currentColor) */
export function Icon({
	name,
	size = "md",
	className,
	style,
}: {
	name: IconName
	size?: IconSize
	className?: string
	style?: React.CSSProperties
}) {
	const Comp = icons[name]
	return <Comp className={cn(SIZES[size], className)} style={style} />
}

/** Multi-tone static icon (img tag) */
export function StaticIcon({
	name,
	size = "md",
	className,
}: {
	name: StaticIconName
	size?: IconSize
	className?: string
}) {
	return <img src={staticIcons[name]} className={cn(SIZES[size], className)} alt="" />
}
