import { useSyncExternalStore } from "react"
import { getChatState, subscribeChat } from "./store"

export function useAiChat() {
	return useSyncExternalStore(subscribeChat, getChatState, getChatState)
}
