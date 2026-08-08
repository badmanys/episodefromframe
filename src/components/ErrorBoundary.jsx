import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card p-8 max-w-md w-full border border-red-500/20 bg-red-950/10">
            <span className="text-5xl mb-4 block">🔥</span>
            <h1 className="text-white font-bold text-xl mb-2">Jejda, něco se rozbilo!</h1>
            <p className="text-white/50 text-sm mb-6">
              Aplikace narazila na nečekanou chybu. Zkuste stránku obnovit.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full btn-primary bg-red-600 hover:bg-red-500 shadow-red-600/30"
            >
              Obnovit a vrátit se na hlavní stranu
            </button>
            <div className="mt-4 p-3 bg-black/40 rounded border border-white/5 text-left overflow-auto max-h-32">
              <code className="text-red-400 text-xs font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Neznámá chyba'}
              </code>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
