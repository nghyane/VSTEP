import { useMediaQuery } from "#/lib/use-media-query"

const MOBILE_QUERY = "(max-width: 767px)"

export function useMobileLanding() {
	return useMediaQuery(MOBILE_QUERY)
}
