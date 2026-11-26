import React from "react";

interface Props {
	children: React.ReactNode;
}

interface State {
	hasError: boolean;
	errorMessage: string;
}

export class AppErrorBoundary extends React.Component<Props, State> {
	declare props: Readonly<Props>;
	state: State = { hasError: false, errorMessage: "" };

	constructor(props: Props) {
		super(props);
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			errorMessage: error?.message || "Lỗi hiển thị không xác định",
		};
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("[AppErrorBoundary] Caught UI error:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-6 font-sans text-slate-800">
					<div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-7 text-center space-y-4">
						<div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center text-2xl font-black">
							!
						</div>
						<h1 className="text-lg font-extrabold text-slate-900">
							Giao diện vừa gặp sự cố tạm thời
						</h1>
						<p className="text-sm text-slate-600 leading-relaxed">
							Toàn bộ dữ liệu và tài khoản trên máy vẫn được bảo vệ an toàn. Vui lòng bấm
							nút bên dưới để tải lại màn hình làm việc.
						</p>
						{this.state.errorMessage && (
							<div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-left break-words">
								{this.state.errorMessage}
							</div>
						)}
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer">
							Tải lại ứng dụng
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
