import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-[100svh] place-items-center bg-bgAbyss px-4 text-textCrisp">
        <section className="glass-card w-full max-w-md p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-warning/25 bg-warning/10 text-warning">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Không thể tải màn hình</h1>
          <p className="mt-2 text-sm leading-6 text-textSeafoam">
            Một component đang gặp lỗi render. Bạn có thể thử tải lại trang, dữ liệu Premium/GPS trên thiết bị vẫn được giữ nguyên.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-oceanCyan px-4 text-sm font-bold text-bgAbyss shadow-[0_0_20px_rgba(34,211,238,0.6)] transition duration-150 ease-out hover:bg-white active:scale-[0.98]"
          >
            <RotateCcw size={17} />
            Tải lại
          </button>
        </section>
      </main>
    );
  }
}
