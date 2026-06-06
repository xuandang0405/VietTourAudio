import { AlertCircle, CheckCircle2, LoaderCircle, SearchX } from 'lucide-react';

export function LoadingState({ title = 'Đang tải dữ liệu', description = 'Vui lòng chờ trong giây lát.' }) {
  return (
    <section className="ui-state loading-state" role="status" aria-live="polite">
      <LoaderCircle size={24} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="skeleton-stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

export function EmptyState({ title = 'Chưa có dữ liệu', description = 'Dữ liệu sẽ hiển thị tại đây khi hệ thống sẵn sàng.' }) {
  return (
    <section className="ui-state empty-state">
      <SearchX size={24} />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function ErrorState({ title = 'Không thể tải dữ liệu', description = 'Vui lòng thử lại hoặc kiểm tra kết nối mạng.' }) {
  return (
    <section className="ui-state error-state" role="alert">
      <AlertCircle size={24} />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function SuccessBadge({ children = 'Thành công' }) {
  return (
    <span className="success-badge">
      <CheckCircle2 size={15} />
      {children}
    </span>
  );
}
