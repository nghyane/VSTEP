import { useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface DoughnutSegment {
	label: string
	value: number
	color: string
}

interface DoughnutChartProps {
	segments: DoughnutSegment[]
	centerLabel?: string
	centerValue?: string | number
	innerRadius?: number
	strokeWidth?: number
	className?: string
}

export function DoughnutChart({
	segments,
	centerLabel,
	centerValue,
	innerRadius = 60,
	className,
}: DoughnutChartProps) {
	const { chartData, chartConfig } = useMemo(() => {
		const config: ChartConfig = {
			count: { label: "B\u00e0i test" },
		}
		const data = segments.map((seg) => {
			const key = seg.label.toLowerCase()
			config[key] = { label: seg.label, color: seg.color }
			return { skill: key, count: seg.value, fill: `var(--color-${key})` }
		})
		return { chartData: data, chartConfig: config }
	}, [segments])

	return (
		<ChartContainer
			config={chartConfig}
			className={cn("mx-auto aspect-square max-h-[250px]", className)}
		>
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent nameKey="skill" hideLabel />}
				/>
				<Pie
					data={chartData}
					dataKey="count"
					nameKey="skill"
					innerRadius={innerRadius}
					strokeWidth={5}
				>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								const isSmall = innerRadius < 50
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) - (centerLabel && !isSmall ? 8 : 0)}
											className={cn("fill-foreground font-bold", isSmall ? "text-xl" : "text-3xl")}
										>
											{centerValue}
										</tspan>
										{centerLabel && !isSmall && (
											<tspan
												x={viewBox.cx}
												y={(viewBox.cy || 0) + 18}
												className="fill-muted-foreground text-xs"
											>
												{centerLabel}
											</tspan>
										)}
									</text>
								)
							}
						}}
					/>
				</Pie>
			</PieChart>
		</ChartContainer>
	)
}

export function DoughnutLegend({
	segments,
	className,
}: { segments: { label: string; value: number; color: string }[]; className?: string }) {
	return (
		<div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
			{segments.map((seg) => (
				<span key={seg.label} className="flex items-center gap-1.5 text-sm">
					<span
						className="inline-block size-2.5 rounded-full"
						style={{ backgroundColor: seg.color }}
					/>
					{seg.label}
					<span className="font-medium tabular-nums">{seg.value}</span>
				</span>
			))}
		</div>
	)
}
