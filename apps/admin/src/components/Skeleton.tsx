import { Skeleton as AntdSkeleton } from "antd"

interface Props {
	className?: string
}

export function Skeleton({ className }: Props) {
	return <AntdSkeleton.Input active size="default" block className={className} />
}
