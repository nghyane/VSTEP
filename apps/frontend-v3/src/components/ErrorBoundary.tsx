import { Component, type ReactNode } from "react"

interface Props {
	children: ReactNode
	fallback?: ReactNode
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
			if (this.props.fallback) return this.props.fallback
			return (
				<div className="flex-1 flex items-center justify-center p-10">
					<div className="text-center">
						<img src="/mascot/lac-sad.png" alt="" className="w-24 h-24 mx-auto mb-4 object-contain" />
						<h2 className="font-extrabold text-xl text-foreground mb-2">Đã có lỗi xảy ra</h2>
						<p className="text-sm text-muted mb-4">{this.state.error.message}</p>
						<button
							type="button"
							onClick={() => this.setState({ error: null })}
							className="btn btn-primary px-6 py-2.5"
						>
							Thử lại
						</button>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}
