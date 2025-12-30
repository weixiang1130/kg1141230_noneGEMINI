import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-red-100">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    系統發生錯誤
                                </h1>
                            </div>

                            <p className="text-gray-600 mb-6">
                                很抱歉，應用程式遇到未預期的錯誤而無法顯示。
                            </p>

                            {this.state.error && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-auto max-h-60 border border-gray-200">
                                    <p className="font-mono text-sm text-red-600 font-semibold mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="font-mono text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-red-200"
                            >
                                <RefreshCw size={18} />
                                重新整理頁面
                            </button>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-xs text-gray-400">
                            如果問題持續發生，請聯繫系統管理員。
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
