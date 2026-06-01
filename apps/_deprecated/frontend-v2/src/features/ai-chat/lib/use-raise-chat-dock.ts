import { useEffect } from "react"
import { setChatBottomOffset } from "./store"

const DEFAULT_OFFSET = "1.5rem"
const GAP_PX = 16 // khoảng cách giữa dock và footer

/**
 * Nâng FloatingChatDock lên phía trên fixed footer của session page.
 *
 * Cách dùng: gọi ở top của SessionView. Hook sẽ tự đo chiều cao của phần tử
 * có `data-session-footer` (hoặc thẻ `<footer class="fixed ... bottom-0">`
 * cuối cùng trong DOM) và theo dõi bằng ResizeObserver để luôn đẩy dock lên
 * trên footer, kể cả khi footer thay đổi kích thước.
 *
 * Unmount tự reset về default.
 */
export function useRaiseChatDock(): void {
	useEffect(() => {
		if (typeof window === "undefined") return

		const findFooter = (): HTMLElement | null => {
			return (
				document.querySelector<HTMLElement>("[data-session-footer]") ??
				document.querySelector<HTMLElement>("footer.fixed.bottom-0, div.fixed.bottom-0")
			)
		}

		let currentFooter: HTMLElement | null = null
		let resizeObs: ResizeObserver | null = null

		const apply = () => {
			const footer = findFooter()
			if (!footer) {
				setChatBottomOffset(DEFAULT_OFFSET)
				return
			}
			const h = footer.getBoundingClientRect().height
			setChatBottomOffset(`${Math.round(h + GAP_PX)}px`)
		}

		const attachObserver = () => {
			const footer = findFooter()
			if (footer === currentFooter) return
			resizeObs?.disconnect()
			currentFooter = footer
			if (footer && typeof ResizeObserver !== "undefined") {
				resizeObs = new ResizeObserver(apply)
				resizeObs.observe(footer)
			}
			apply()
		}

		attachObserver()

		// Watch DOM for footer mount/unmount
		const mutObs = new MutationObserver(attachObserver)
		mutObs.observe(document.body, { childList: true, subtree: true })

		window.addEventListener("resize", apply)

		return () => {
			mutObs.disconnect()
			resizeObs?.disconnect()
			window.removeEventListener("resize", apply)
			setChatBottomOffset(DEFAULT_OFFSET)
		}
	}, [])
}
