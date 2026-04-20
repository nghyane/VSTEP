import { useEffect, type RefObject } from "react"

export function useClickOutside(ref: RefObject<HTMLElement | null>, handler: () => void) {
	useEffect(() => {
		function onDown(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) handler()
		}
		document.addEventListener("mousedown", onDown)
		return () => document.removeEventListener("mousedown", onDown)
	}, [ref, handler])
}
