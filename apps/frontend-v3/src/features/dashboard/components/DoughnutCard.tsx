import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SkillIcon } from "#/components/SkillIcon"
import { overviewQuery } from "#/features/dashboard/queries"
import type { ScoreTimelinePoint } from "#/features/dashboard/types"
import { type SkillKey, skills } from "#/lib/skills"
import { cn } from "#/lib/utils"

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 70
const STROKE = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function segmentTooltipPosition(offsetDeg: number, dash: number) {
	const midDeg = offsetDeg + (dash / CIRCUMFERENCE) * 180 - 90
	const rad = (midDeg * Math.PI) / 180
	const distance = 92
	return {
		left: `${50 + Math.cos(rad) * (distance / SIZE) * 100}%`,
		top: `${50 + Math.sin(rad) * (distance / SIZE) * 100}%`,
	}
}

function countBySkill(timeline: ScoreTimelinePoint[]): Record<string, number> {
	const result: Record<string, number> = { listening: 0, reading: 0, writing: 0, speaking: 0 }
	for (const point of timeline) {
		for (const sk of skills) {
			if (point[sk.key] !== null && point[sk.key] !== undefined) {
				result[sk.key] = (result[sk.key] ?? 0) + 1
			}
		}
	}
	return result
}

function averageBySkill(timeline: ScoreTimelinePoint[]): Record<string, number | null> {
	const result: Record<string, number | null> = {
		listening: null,
		reading: null,
		writing: null,
		speaking: null,
	}
	for (const skill of skills) {
		const values = timeline
			.map((point) => point[skill.key])
			.filter((value): value is number => value !== null)
		result[skill.key] =
			values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null
	}
	return result
}

export function DoughnutCard() {
	const { data: overview } = useQuery(overviewQuery)
	const [activeSkill, setActiveSkill] = useState<SkillKey | null>(null)
	if (!overview) return null

	const counts = countBySkill(overview.data.scores.timeline)
	const averages = averageBySkill(overview.data.scores.timeline)
	const total = skills.reduce((acc, s) => acc + (counts[s.key] ?? 0), 0)

	let cursor = 0
	const segments = skills.map((s) => {
		const value = counts[s.key] ?? 0
		const average = averages[s.key] ?? null
		const pct = total > 0 ? value / total : 0
		const dash = pct * CIRCUMFERENCE
		const offset = cursor
		cursor += dash
		return { skill: s, value, average, pct, dash, offsetDeg: (offset / CIRCUMFERENCE) * 360 }
	})
	const activeSegment =
		segments.find((segment) => segment.skill.key === activeSkill && segment.value > 0) ?? null
	const centerValue = activeSegment ? activeSegment.value : total
	const centerLabel = activeSegment ? activeSegment.skill.label : "LƯỢT"
	const centerHint = activeSegment ? `${Math.round(activeSegment.pct * 100)}% tổng lượt` : null
	const tooltipPosition = activeSegment
		? segmentTooltipPosition(activeSegment.offsetDeg, activeSegment.dash)
		: null

	return (
		<div className="card p-6 flex flex-col">
			<h3 className="font-extrabold text-lg text-foreground">Số bài thi đã làm</h3>
			<p className="text-sm text-subtle mt-1">
				{total > 0 ? `Tổng ${total} lượt làm theo từng kỹ năng` : "Chưa có bài thi nào được hoàn thành"}
			</p>

			<div className="relative flex-1 flex items-center justify-center py-4">
				{activeSegment && tooltipPosition && (
					<DoughnutTooltip segment={activeSegment} position={tooltipPosition} />
				)}
				<svg
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="w-full max-w-[320px] aspect-square overflow-visible"
					role="img"
					aria-label="Tổng số bài thi theo kỹ năng"
					onMouseLeave={() => setActiveSkill(null)}
				>
					<circle
						cx={CENTER}
						cy={CENTER}
						r={RADIUS}
						fill="none"
						stroke="var(--color-background)"
						strokeWidth={STROKE}
					/>
					{total > 0 &&
						segments.map((seg) => {
							if (seg.value === 0) return null
							const isActive = activeSkill === seg.skill.key
							const isDimmed = activeSkill !== null && !isActive

							return (
								<circle
									key={seg.skill.key}
									cx={CENTER}
									cy={CENTER}
									r={isActive ? RADIUS + 2 : RADIUS}
									fill="none"
									stroke={seg.skill.color}
									strokeWidth={isActive ? STROKE + 8 : STROKE}
									strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
									strokeDashoffset={0}
									transform={`rotate(${seg.offsetDeg - 90} ${CENTER} ${CENTER})`}
									strokeLinecap="butt"
									opacity={isDimmed ? 0.35 : 0.95}
									className="cursor-pointer transition-all duration-200 ease-out drop-shadow-sm"
									onMouseEnter={() => setActiveSkill(seg.skill.key)}
								/>
							)
						})}
					<text
						x={CENTER}
						y={CENTER - (centerHint ? 14 : 6)}
						textAnchor="middle"
						dominantBaseline="central"
						fontSize={36}
						fontWeight={800}
						fill="var(--color-foreground)"
					>
						{centerValue}
					</text>
					<text
						x={CENTER}
						y={CENTER + 18}
						textAnchor="middle"
						dominantBaseline="central"
						fontSize={activeSegment ? 13 : 11}
						fontWeight={700}
						fill={activeSegment ? activeSegment.skill.color : "var(--color-subtle)"}
					>
						{centerLabel}
					</text>
					{centerHint && (
						<text
							x={CENTER}
							y={CENTER + 36}
							textAnchor="middle"
							dominantBaseline="central"
							fontSize={9}
							fontWeight={700}
							fill="var(--color-subtle)"
						>
							{centerHint}
						</text>
					)}
				</svg>
			</div>

			<div className="grid grid-cols-2 gap-2 mt-2">
				{skills.map((s) => {
					const value = counts[s.key] ?? 0
					return (
						<button
							key={s.key}
							type="button"
							onMouseEnter={() => setActiveSkill(s.key)}
							onMouseLeave={() => setActiveSkill(null)}
							className={cn(
								"flex items-center gap-2 rounded-(--radius-button) border-2 border-transparent p-2 text-left text-sm transition-all duration-200",
								activeSkill === s.key && "scale-[1.03] border-current bg-surface shadow-sm",
							)}
							style={{ color: activeSkill === s.key ? s.color : undefined }}
						>
							<SkillIcon name={s.pngIcon} size="sm" />
							<span className="font-bold text-foreground">{s.label}</span>
							<span className="ml-auto text-lg tabular-nums font-extrabold" style={{ color: s.color }}>
								{value}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}

interface DoughnutTooltipProps {
	segment: {
		skill: (typeof skills)[number]
		value: number
		average: number | null
		pct: number
	}
	position: { left: string; top: string }
}

function DoughnutTooltip({ segment, position }: DoughnutTooltipProps) {
	return (
		<div
			className="pointer-events-none absolute z-10 min-w-[144px] -translate-x-1/2 -translate-y-1/2 rounded-(--radius-card) border-2 border-border bg-card px-3 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.16)] animate-[popIn_180ms_ease-out]"
			style={position}
		>
			<div className="flex items-center gap-2">
				<SkillIcon name={segment.skill.pngIcon} size="sm" />
				<div className="min-w-0">
					<p className="text-xs font-extrabold text-foreground">{segment.skill.label}</p>
					<p className="text-[11px] font-bold text-subtle">Điểm trung bình</p>
				</div>
			</div>
			<p className="mt-2 text-2xl font-extrabold tabular-nums" style={{ color: segment.skill.color }}>
				{segment.average !== null ? segment.average.toFixed(1) : "—"}
				<span className="ml-1 text-xs font-bold text-subtle">/10</span>
			</p>
		</div>
	)
}
