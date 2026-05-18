import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { WordCompareResult } from "#/lib/utils"
import { cn } from "#/lib/utils"

interface Props {
	words: WordCompareResult[]
}

const STYLE: Record<string, string> = {
	correct: "border-success bg-success/10 text-success",
	wrong: "border-destructive bg-destructive/10 text-destructive",
	close: "border-warning bg-warning/10 text-warning",
}

const ICON: Record<string, "check" | "close" | "lightning"> = {
	correct: "check",
	wrong: "close",
	close: "lightning",
}

const LABEL: Record<string, string> = {
	correct: "Chính xác",
	close: "Gần đúng",
	wrong: "Chưa đúng",
}

export function ShadowingWordChips({ words }: Props) {
	const [selected, setSelected] = useState<number | null>(null)
	const active = selected !== null ? words[selected] : null

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-2">
				{words.map((w, i) => (
					<button
						key={`${w.word}-${i}`}
						type="button"
						onClick={() => setSelected(selected === i ? null : i)}
						className={cn(
							"inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 text-sm font-bold transition active:scale-95",
							STYLE[w.accuracy],
							selected === i && "ring-2 ring-offset-1 ring-foreground/20",
						)}
					>
						{w.word}
						<Icon name={ICON[w.accuracy]} size="xs" className={w.accuracy === "wrong" ? "scale-75" : ""} />
					</button>
				))}
			</div>

			{active && (
				<div
					className={cn(
						"rounded-(--radius-card) border-2 border-b-4 p-3 animate-[menuIn_0.15s_ease-out]",
						active.accuracy === "correct"
							? "border-success/30 bg-success/5"
							: active.accuracy === "close"
								? "border-warning/30 bg-warning/5"
								: "border-destructive/30 bg-destructive/5",
					)}
				>
					<div className="flex items-center gap-2 mb-1.5">
						<Icon
							name={ICON[active.accuracy]}
							size="xs"
							className={cn(
								active.accuracy === "correct"
									? "text-success"
									: active.accuracy === "close"
										? "text-warning"
										: "text-destructive",
							)}
						/>
						<span
							className={cn(
								"text-xs font-extrabold uppercase tracking-wider",
								active.accuracy === "correct"
									? "text-success"
									: active.accuracy === "close"
										? "text-warning"
										: "text-destructive",
							)}
						>
							{LABEL[active.accuracy]}
						</span>
					</div>

					<div className="space-y-1">
						<p className="text-sm text-foreground">
							<span className="text-muted">Từ gốc: </span>
							<span className="font-bold">{active.word}</span>
						</p>
						{active.accuracy === "correct" && (
							<p className="text-xs text-success italic">Bạn đã phát âm chính xác từ này.</p>
						)}
						{active.accuracy === "close" && active.userSaid && (
							<>
								<p className="text-sm text-foreground">
									<span className="text-muted">Bạn nói: </span>
									<span className="font-bold text-warning">"{active.userSaid}"</span>
								</p>
								<p className="text-xs text-muted italic">Gần đúng — hãy chú ý phát âm rõ hơn.</p>
							</>
						)}
						{active.accuracy === "wrong" && active.userSaid ? (
							<>
								<p className="text-sm text-foreground">
									<span className="text-muted">Bạn nói: </span>
									<span className="font-bold text-destructive">"{active.userSaid}"</span>
								</p>
								<p className="text-xs text-muted italic">
									Từ đúng là "{active.word}" — hãy nghe lại và chú ý phát âm từ này.
								</p>
							</>
						) : active.accuracy === "wrong" ? (
							<p className="text-xs text-destructive italic">
								Bạn chưa nói đến từ này — hãy thử nhại lại câu đầy đủ.
							</p>
						) : null}
					</div>
				</div>
			)}
		</div>
	)
}
