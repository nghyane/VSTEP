import { Switch as AntdSwitch } from "antd"

interface Props {
	checked: boolean
	onChange: (value: boolean) => void
	disabled?: boolean
	label?: string
	id?: string
}

export function Switch({ checked, onChange, disabled, label, id }: Props) {
	const sw = <AntdSwitch id={id} checked={checked} onChange={onChange} disabled={disabled} />
	if (!label) return sw
	return (
		<label
			htmlFor={id}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				cursor: disabled ? "not-allowed" : "pointer",
			}}
		>
			{sw}
			<span style={{ fontSize: 14 }}>{label}</span>
		</label>
	)
}
