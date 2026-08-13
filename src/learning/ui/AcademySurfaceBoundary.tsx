import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface AcademySurfaceBoundaryState {
  error?: Error
}

export class AcademySurfaceBoundary extends Component<{
  children: ReactNode
  scope: string
  onReset: () => void
  onFallback?: () => void
  fallbackLabel?: string
}, AcademySurfaceBoundaryState> {
  state: AcademySurfaceBoundaryState = {}

  static getDerivedStateFromError(error: Error): AcademySurfaceBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[academy:${this.props.scope}]`, error, info)
  }

  componentDidUpdate(previous: Readonly<typeof this.props>): void {
    if (previous.scope !== this.props.scope && this.state.error) this.setState({})
  }

  render() {
    const error = this.state.error
    if (!error) return this.props.children
    return (
      <section className="academy-error-state" role="alert">
        <TriangleAlert size={24} />
        <div>
          <h2>Esta parte de Academia no ha podido mostrarse</h2>
          <p>La sesión, el progreso, las evidencias y el proyecto técnico permanecen a salvo.</p>
          <details>
            <summary>Abrir diagnóstico técnico</summary>
            <code>{error.name}: {error.message}</code>
          </details>
        </div>
        <div className="academy-error-state__actions">
          <button type="button" onClick={() => {
            this.setState({})
            this.props.onReset()
          }}>Volver a intentar</button>
          {this.props.onFallback && (
            <button type="button" onClick={() => {
              this.setState({})
              this.props.onFallback?.()
            }}>{this.props.fallbackLabel ?? 'Usar alternativa segura'}</button>
          )}
        </div>
      </section>
    )
  }
}
