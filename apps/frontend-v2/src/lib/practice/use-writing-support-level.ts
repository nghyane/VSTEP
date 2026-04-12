import { useSyncExternalStore } from "react"
import {
	getWritingSupportLevel,
	subscribeWritingSupportLevel,
	type WritingSupportLevel,
} from "./writing-support-level"

export function useWritingSupportLevel(): WritingSupportLevel {
	return useSyncExternalStore(subscribeWritingSupportLevel, getWritingSupportLevel, () => "off")
}
