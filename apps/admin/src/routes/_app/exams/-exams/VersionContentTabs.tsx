import { AudioOutlined, EditOutlined, LoadingOutlined, ReadOutlined, SoundOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Empty, Skeleton, Tabs } from "antd"
import { adminExamVersionDetailQuery } from "#/features/admin-exams/queries"
import { ListeningTab } from "./ListeningTab"
import { ReadingTab } from "./ReadingTab"
import { SpeakingTab } from "./SpeakingTab"
import { WritingTab } from "./WritingTab"

interface Props {
	examId: string
	versionId: string
	tab: "listening" | "reading" | "writing" | "speaking"
}

export function VersionContentTabs({ examId, versionId, tab }: Props) {
	const navigate = useNavigate({ from: "/exams/$examId" })
	const { data, isLoading, isFetching } = useQuery(adminExamVersionDetailQuery(examId, versionId))

	if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />

	const version = data?.data
	if (!version) return <Empty description="Không tìm thấy phiên bản." />

	const items = [
		{
			key: "listening",
			label: "Listening",
			icon: <SoundOutlined />,
			children: (
				<ListeningTab sections={version.listening_sections ?? []} examId={examId} versionId={versionId} />
			),
		},
		{
			key: "reading",
			label: "Reading",
			icon: <ReadOutlined />,
			children: (
				<ReadingTab passages={version.reading_passages ?? []} examId={examId} versionId={versionId} />
			),
		},
		{
			key: "writing",
			label: "Writing",
			icon: <EditOutlined />,
			children: <WritingTab tasks={version.writing_tasks ?? []} examId={examId} versionId={versionId} />,
		},
		{
			key: "speaking",
			label: "Speaking",
			icon: <AudioOutlined />,
			children: <SpeakingTab parts={version.speaking_parts ?? []} examId={examId} versionId={versionId} />,
		},
	]

	return (
		<div style={{ position: "relative", opacity: isFetching ? 0.7 : 1, transition: "opacity 0.15s" }}>
			{isFetching && (
				<LoadingOutlined
					spin
					style={{
						position: "absolute",
						top: 8,
						right: 8,
						fontSize: 16,
						color: "var(--ant-color-primary, #1677ff)",
						zIndex: 1,
					}}
				/>
			)}
			<Tabs
				activeKey={tab}
				onChange={(key) => navigate({ search: (prev) => ({ ...prev, tab: key as Props["tab"] }) })}
				items={items}
			/>
		</div>
	)
}
