import { BookmarkCheck, Download, Headphones } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';

const savedItems = [
  ['Hoàng Thành Huế', 'Đã tải · 38 phút'],
  ['Bảo tàng Chăm Đà Nẵng', 'Đã lưu · 25 phút'],
  ['Chợ Bến Thành', 'Đã nghe gần đây · 18 phút']
];

function Saved() {
  const isLoading = false;
  const hasError = false;

  return (
    <main className="screen saved-screen">
      <section className="screen-heading">
        <p className="eyebrow">Library</p>
        <h1>Của tôi</h1>
        <p>Các audio đã lưu và nội dung có thể nghe ngoại tuyến.</p>
      </section>

      {isLoading && <LoadingState title="Đang tải thư viện" description="Đang lấy danh sách audio đã lưu." />}
      {hasError && <ErrorState title="Không thể tải thư viện" description="Vui lòng thử lại khi kết nối ổn định." />}
      {!isLoading && !hasError && savedItems.length === 0 && (
        <EmptyState title="Chưa có audio đã lưu" description="Các audio tải về hoặc đánh dấu sẽ xuất hiện tại đây." />
      )}
      {!isLoading && !hasError && savedItems.length > 0 && (
        <div className="saved-list">
          {savedItems.map(([title, meta]) => (
            <article className="saved-item" key={title}>
              <span className="saved-icon"><Headphones size={20} /></span>
              <div>
                <h2>{title}</h2>
                <p>{meta}</p>
              </div>
              <button type="button" aria-label={`Tải ${title}`}>
                {meta.startsWith('Đã tải') ? <BookmarkCheck size={19} /> : <Download size={19} />}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Saved;
