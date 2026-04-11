import { createFileRoute } from "@tanstack/react-router"
import { ComingSoon } from "#/components/common/ComingSoon"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/doc")({
	component: ReadingPage,
})

function ReadingPage() {
	return <ComingSoon backTo="/luyen-tap/ky-nang" backLabel="4 kỹ năng" title="Luyện Đọc" />
}
