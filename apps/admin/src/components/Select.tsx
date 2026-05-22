import { Select as AntdSelect } from "antd"
import { Children, forwardRef, isValidElement, type ReactNode, type SelectHTMLAttributes } from "react"

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
	invalid?: boolean
	children: ReactNode
	onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"]
	placeholder?: string
}

interface OptionLike {
	value: string | number
	label: ReactNode
	disabled?: boolean
}

function flattenOptions(children: ReactNode): OptionLike[] {
	const opts: OptionLike[] = []
	Children.forEach(children, (child) => {
		if (!isValidElement(child)) return
		const el = child as React.ReactElement<{
			value?: string | number
			children?: ReactNode
			disabled?: boolean
			label?: string
		}>
		if (el.type === "option") {
			opts.push({
				value: el.props.value ?? "",
				label: el.props.children ?? "",
				disabled: el.props.disabled,
			})
		} else if (el.type === "optgroup") {
			opts.push(...flattenOptions(el.props.children))
		}
	})
	return opts
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
	{ invalid, className, children, value, defaultValue, onChange, disabled, name, id, placeholder },
	_ref,
) {
	const options = flattenOptions(children)

	function handleChange(next: unknown) {
		if (!onChange) return
		const synthetic = {
			target: { value: next as string, name },
			currentTarget: { value: next as string, name },
		} as unknown as React.ChangeEvent<HTMLSelectElement>
		onChange(synthetic)
	}

	return (
		<AntdSelect
			id={id}
			status={invalid ? "error" : undefined}
			className={className}
			style={{ width: "100%" }}
			value={value as string | number | undefined}
			defaultValue={defaultValue as string | number | undefined}
			onChange={handleChange}
			disabled={disabled}
			placeholder={placeholder}
			options={options}
		/>
	)
})
