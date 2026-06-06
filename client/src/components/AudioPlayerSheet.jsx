import { useState } from 'react';
import { FastForward, Globe2, Pause, Rewind, Satellite, Volume2, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics.js';

function AudioPlayerSheet() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleCollapse = () => {
    triggerHaptic(12);
    setIsCollapsed(!isCollapsed);
  };

  const togglePlay = () => {
    triggerHaptic([18, 24, 18]);
    setIsPlaying(!isPlaying);
  };

  if (isCollapsed) {
    return (
      <aside className="audio-sheet smart-audio-sheet collapsed haptic-ripple" aria-label="Trình phát thuyết minh thông minh" onClick={toggleCollapse}>
        <div className="collapsed-player-content">
          <span className="collapsed-cover">CN</span>
          <div className="collapsed-meta">
            <h2>Sạp Đồ Cổ Chú Năm</h2>
            <p>{isPlaying ? 'Đang phát' : 'Tạm dừng'} · Tiếng Việt</p>
          </div>
          <div className="collapsed-actions" onClick={(e) => e.stopPropagation()}>
            <button className="collapsed-play-btn" type="button" onClick={togglePlay} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button className="collapsed-expand-btn" type="button" onClick={toggleCollapse} aria-label="Mở rộng">
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="audio-sheet smart-audio-sheet" aria-label="Trình phát thuyết minh thông minh">
      <div className="audio-breadcrumbs">
        <span>Khu vực: Nguyễn Huệ &gt; Sạp Đồ Cổ Chú Năm</span>
        <button className="minimize-button" type="button" aria-label="Thu nhỏ" onClick={toggleCollapse}>
          <ChevronDown size={18} />
        </button>
      </div>
      <div className="audio-cover">
        <span>CN</span>
      </div>
      <div className="audio-meta">
        <span className="audio-kicker">{isPlaying ? 'Đang phát' : 'Đang tạm dừng'} · Tiếng Việt</span>
        <h2>Sạp Đồ Cổ Chú Năm</h2>
        <div className={`waveform ${isPlaying ? 'playing' : 'paused'}`} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ '--bar': `${22 + ((index * 17) % 46)}px` }} />
          ))}
        </div>
        <div className="audio-progress">
          <span>01:18</span>
          <div><span style={{ width: isPlaying ? '36%' : '30%' }} /></div>
          <span>04:20</span>
        </div>
      </div>
      <p className="audio-smart-state">
        <Satellite size={15} />
        Bạn đang trong bán kính sạp. Audio tự động phát.
      </p>
      <div className="audio-controls">
        <button type="button" aria-label="Lùi 15 giây" onClick={() => triggerHaptic(14)}><Rewind size={19} /></button>
        <button className="play-button haptic-ripple" type="button" aria-label={isPlaying ? 'Tạm dừng' : 'Phát'} onClick={togglePlay}>
          {isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}
        </button>
        <button type="button" aria-label="Tới 15 giây" onClick={() => triggerHaptic(14)}><FastForward size={19} /></button>
      </div>
      <div className="audio-tools">
        <button type="button"><Volume2 size={15} />1.0x</button>
        <button type="button"><Globe2 size={15} />VI</button>
        <button type="button"><Satellite size={15} />Auto GPS</button>
      </div>
    </aside>
  );
}

export default AudioPlayerSheet;
