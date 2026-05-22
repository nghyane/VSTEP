import { Button, Result } from "antd"
import { Component, type ReactNode } from "react"

interface Props {
	children: ReactNode
}

interface State {
	error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null }

	static getDerivedStateFromError(error: Error): State {
		return { error }
	}

	render() {
		if (this.state.error) {
			return (
				<Result
					status="error"
					title="Đã có lỗi xảy ra"
					subTitle={this.state.error.message}
					extra={
						<Button type="primary" onClick={() => this.setState({ error: null })}>
							Thử lại
						</Button>
					}
				/>
			)
		}
		return this.props.children
	}
}
