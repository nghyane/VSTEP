import { Tabs as AntdTabs } from "antd"

interface TabItem {
	label: string
	value: string
}

interface Props {
	tabs: TabItem[]
	active: string
	onChange: (value: string) => void
	className?: string
}

export function Tabs({ tabs, active, onChange, className }: Props) {
	return (
		<AntdTabs
			className={className}
			activeKey={active}
			onChange={onChange}
			items={tabs.map((t) => ({ key: t.value, label: t.label }))}
		/>
	)
}
