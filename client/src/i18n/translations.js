import { useLanguageStore } from '../stores/languageStore';

const translations = {
  vi: {
    smartGuide: 'Hướng dẫn thông minh', explore: 'Khám phá', list: 'Danh sách', unlock: 'Mở khóa', settings: 'Cài đặt',
    heroPrefix: 'Khám phá vẻ đẹp qua', heroHighlight: 'giọng kể AI', heroDescription: 'Tự động phát audio theo vị trí GPS. Trải nghiệm du lịch thông minh, tiện lợi, không cần đăng nhập.',
    startExperience: 'Bắt đầu trải nghiệm', requestingGps: 'Đang xin quyền GPS...', demoExperience: 'Trải nghiệm Demo', autoGps: 'GPS tự động', textAndImages: 'Chữ và hình ảnh', premiumAudio: 'Audio Premium',
    gpsReady: 'GPS đã sẵn sàng. Hãy bắt đầu khám phá.', gpsFailed: 'Chưa lấy được GPS. Bạn có thể cấp quyền lại hoặc dùng bản demo.', demoEnabled: 'Đang dùng chế độ Demo. Vị trí giả lập tại trung tâm.', gpsDenied: 'GPS bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.',
    inArea: 'Trong khu vực', stallsAndDestinations: 'Sạp và điểm đến', audioAvailable: 'Có Audio / TTS', audioPremium: 'Audio Premium', unlockPremium24h: 'Mở khóa Premium 24h', discoverMore: 'Khám phá thêm', nextDestination: 'Điểm đến tiếp theo của bạn?',
    mapTitle: 'Nguyễn Huệ', locating: 'Đang tìm kiếm vị trí của bạn', locatingHelp: 'Hãy cấp quyền GPS để hệ thống tự tìm POI gần bạn. Chế độ Demo chỉ dùng khi cần trình diễn prototype.', enableGps: 'Bật GPS', gettingGps: 'Đang lấy GPS...', demo: 'Demo', searchPlaceholder: 'Tìm sạp, quán ăn, di tích trong khu vực...', noPoi: 'Không tìm thấy POI phù hợp.', yourLocation: 'Vị trí của bạn', relocate: 'Định vị lại',
    qrOpened: 'Đã mở {name} từ mã QR.', nearPoi: 'Bạn đã đến gần {name}. Đang phát thuyết minh.', locationUpdated: 'Đã cập nhật vị trí hiện tại.', locationFailed: 'Không lấy được GPS. Bạn có thể thử lại hoặc chọn chế độ Demo.', demoGpsEnabled: 'Đã bật GPS giả lập cho phần trình diễn prototype.', demoMoved: 'GPS demo đã di chuyển đến gần {name}.',
    rating: 'Đánh giá', freeText: 'Bản chữ miễn phí', hideQr: 'Ẩn QR của điểm này', showQr: 'Hiện QR mở đúng POI', scanToOpen: 'Quét mã để mở trực tiếp {name}', qrTracking: 'Hệ thống sẽ tự ghi nhận lượt quét trong phiên trải nghiệm.', readyToPlay: 'Sẵn sàng phát', insideRadius: 'Bạn đang trong bán kính POI. Audio tự động phát.', replay: 'Phát lại', playingAgain: 'Đang phát lại audio thuyết minh.', cannotPlay: 'Không thể phát audio trên trình duyệt này.', textOnly: 'Chỉ có bản chữ. Mở khóa để nghe giọng đọc AI.', unlockAudio: 'Mở khóa Audio - 30.000đ', browserTts: 'Browser TTS', close: 'Đóng',
    deviceStatus: 'Trạng thái thiết bị', noLogin: 'Không cần đăng nhập', premiumPass: 'Premium Pass', remaining: 'Còn {time}', audioLockedFree: 'Audio đang khóa ở chế độ miễn phí', disablePremiumDemo: 'Tắt Premium demo', language: 'Ngôn ngữ', languageHelp: 'Áp dụng cho giao diện, nội dung và giọng đọc', gpsStatus: 'Trạng thái: {status}', clearLocation: 'Xóa vị trí lưu trên giao diện', locationCleared: 'Đã xóa vị trí demo/GPS hiện tại.',
    waiting: 'Đang chờ...', playing: 'Đang phát', stopped: 'Đã dừng', queue: 'Hàng chờ: {count} POI', listening: 'Đang nghe', noInfo: 'Chưa có thông tin', replayAfter: 'Có thể phát lại sau:', offline: 'Bạn đang ngoại tuyến. Nội dung đã xem vẫn có thể hiển thị.',
    premiumRemaining: 'Premium còn:', upgradePremium: 'Nâng cấp Premium (24h)', premiumActivated: 'Premium demo đã được kích hoạt 24 giờ.', paymentSuccess: 'Thanh toán thành công. Premium đã mở khóa 24 giờ.',
    openPremium: 'Mở khóa Premium', activateAudio: 'Kích hoạt Audio thông minh 24h', bank: 'Ngân hàng', transferContent: 'Nội dung', paid: 'Tôi đã thanh toán'
  },
  en: {
    smartGuide: 'Smart Guide', explore: 'Explore', list: 'List', unlock: 'Unlock', settings: 'Settings',
    heroPrefix: 'Discover beauty through', heroHighlight: 'AI storytelling', heroDescription: 'Automatically play audio based on GPS. A convenient smart travel experience with no login required.',
    startExperience: 'Start experience', requestingGps: 'Requesting GPS...', demoExperience: 'Try Demo', autoGps: 'Automatic GPS', textAndImages: 'Text & images', premiumAudio: 'Premium Audio',
    gpsReady: 'GPS is ready. Start exploring.', gpsFailed: 'GPS is unavailable. Allow access again or use Demo mode.', demoEnabled: 'Demo mode is active at the central location.', gpsDenied: 'Location access was denied. Enable it in your browser settings to continue.',
    inArea: 'In this area', stallsAndDestinations: 'Stalls and destinations', audioAvailable: 'Audio / TTS available', audioPremium: 'Premium Audio', unlockPremium24h: 'Unlock Premium for 24h', discoverMore: 'Discover more', nextDestination: 'Where will you go next?',
    mapTitle: 'Nguyen Hue', locating: 'Finding your location', locatingHelp: 'Allow GPS so the app can find nearby POIs. Demo mode is only for prototype presentations.', enableGps: 'Enable GPS', gettingGps: 'Getting GPS...', demo: 'Demo', searchPlaceholder: 'Search stalls, food, or landmarks...', noPoi: 'No matching POI found.', yourLocation: 'Your location', relocate: 'Locate again',
    qrOpened: 'Opened {name} from QR code.', nearPoi: 'You are near {name}. Starting narration.', locationUpdated: 'Current location updated.', locationFailed: 'GPS is unavailable. Try again or choose Demo mode.', demoGpsEnabled: 'Demo GPS is enabled for the prototype.', demoMoved: 'Demo GPS moved near {name}.',
    rating: 'Rating', freeText: 'Free text guide', hideQr: 'Hide this POI QR', showQr: 'Show QR for this POI', scanToOpen: 'Scan to open {name}', qrTracking: 'The scan will be recorded for this experience session.', readyToPlay: 'Ready to play', insideRadius: 'You are inside the POI radius. Audio starts automatically.', replay: 'Replay', playingAgain: 'Replaying narration.', cannotPlay: 'Audio cannot be played in this browser.', textOnly: 'Text only. Unlock to hear AI narration.', unlockAudio: 'Unlock Audio - 30,000 VND', browserTts: 'Browser TTS', close: 'Close',
    deviceStatus: 'Device status', noLogin: 'No login required', premiumPass: 'Premium Pass', remaining: '{time} remaining', audioLockedFree: 'Audio is locked in free mode', disablePremiumDemo: 'Disable Premium demo', language: 'Language', languageHelp: 'Applies to interface, content, and narration', gpsStatus: 'Status: {status}', clearLocation: 'Clear saved location', locationCleared: 'Current GPS/demo location was cleared.',
    waiting: 'Waiting...', playing: 'Playing', stopped: 'Stopped', queue: 'Queue: {count} POIs', listening: 'Now listening', noInfo: 'No information', replayAfter: 'Replay available in:', offline: 'You are offline. Previously viewed content may remain available.',
    premiumRemaining: 'Premium remaining:', upgradePremium: 'Upgrade Premium (24h)', premiumActivated: 'Premium demo activated for 24 hours.', paymentSuccess: 'Payment successful. Premium unlocked for 24 hours.',
    openPremium: 'Unlock Premium', activateAudio: 'Activate smart Audio for 24h', bank: 'Bank', transferContent: 'Transfer note', paid: 'I have paid'
  },
  zh: {
    smartGuide: '智能导览', explore: '探索', list: '列表', unlock: '解锁', settings: '设置',
    heroPrefix: '通过', heroHighlight: 'AI语音故事探索美景', heroDescription: '根据GPS位置自动播放讲解。无需登录，即可体验便捷的智能旅行。',
    startExperience: '开始体验', requestingGps: '正在请求GPS权限...', demoExperience: '体验演示模式', autoGps: '自动GPS', textAndImages: '文字与图片', premiumAudio: '高级语音',
    gpsReady: 'GPS已就绪，开始探索吧。', gpsFailed: '暂时无法获取GPS。您可以重新授权或使用演示模式。', demoEnabled: '演示模式已开启，模拟位置位于中心区域。', gpsDenied: '位置权限已被拒绝。请在浏览器设置中开启权限。',
    inArea: '当前区域', stallsAndDestinations: '摊位与景点', audioAvailable: '支持语音 / TTS', audioPremium: '高级语音', unlockPremium24h: '解锁高级版24小时', discoverMore: '探索更多', nextDestination: '下一站去哪里？',
    mapTitle: '阮惠步行街', locating: '正在查找您的位置', locatingHelp: '请允许GPS，以便自动查找附近景点。演示模式仅用于原型展示。', enableGps: '开启GPS', gettingGps: '正在获取GPS...', demo: '演示', searchPlaceholder: '搜索摊位、美食或景点...', noPoi: '未找到符合条件的景点。', yourLocation: '您的位置', relocate: '重新定位',
    qrOpened: '已通过二维码打开{name}。', nearPoi: '您已接近{name}，正在播放讲解。', locationUpdated: '当前位置已更新。', locationFailed: '无法获取GPS，请重试或选择演示模式。', demoGpsEnabled: '原型演示GPS已开启。', demoMoved: '演示GPS已移动到{name}附近。',
    rating: '评分', freeText: '免费文字介绍', hideQr: '隐藏此景点二维码', showQr: '显示此景点二维码', scanToOpen: '扫码直接打开{name}', qrTracking: '系统将在本次体验中记录扫码次数。', readyToPlay: '可以播放', insideRadius: '您已进入景点范围，语音将自动播放。', replay: '重新播放', playingAgain: '正在重新播放讲解。', cannotPlay: '此浏览器无法播放语音。', textOnly: '仅提供文字。解锁后可收听AI讲解。', unlockAudio: '解锁语音 - 30,000越南盾', browserTts: '浏览器语音', close: '关闭',
    deviceStatus: '设备状态', noLogin: '无需登录', premiumPass: '高级通行证', remaining: '剩余{time}', audioLockedFree: '免费模式下语音已锁定', disablePremiumDemo: '关闭高级演示', language: '语言', languageHelp: '应用于界面、内容和语音', gpsStatus: '状态：{status}', clearLocation: '清除保存的位置', locationCleared: '已清除当前GPS/演示位置。',
    waiting: '等待中...', playing: '播放中', stopped: '已停止', queue: '播放队列：{count}个景点', listening: '正在收听', noInfo: '暂无信息', replayAfter: '可重新播放倒计时：', offline: '当前处于离线状态，已浏览的内容仍可能显示。',
    premiumRemaining: '高级版剩余：', upgradePremium: '升级高级版（24小时）', premiumActivated: '高级演示已激活24小时。', paymentSuccess: '支付成功，高级版已解锁24小时。',
    openPremium: '解锁高级版', activateAudio: '激活24小时智能语音', bank: '银行', transferContent: '转账内容', paid: '我已付款'
  },
  ja: {
    smartGuide: 'スマートガイド', explore: '探索', list: '一覧', unlock: '解除', settings: '設定',
    heroPrefix: '', heroHighlight: 'AI音声で美しさを発見', heroDescription: 'GPS位置に応じて音声ガイドを自動再生します。ログイン不要で便利なスマート旅行を体験できます。',
    startExperience: '体験を始める', requestingGps: 'GPS許可を確認中...', demoExperience: 'デモを体験', autoGps: '自動GPS', textAndImages: '文字と画像', premiumAudio: 'プレミアム音声',
    gpsReady: 'GPSの準備ができました。探索を始めましょう。', gpsFailed: 'GPSを取得できません。再許可するかデモをご利用ください。', demoEnabled: '中心地点でデモモードを開始しました。', gpsDenied: '位置情報が拒否されました。ブラウザ設定で許可してください。',
    inArea: 'このエリア', stallsAndDestinations: '店舗と観光スポット', audioAvailable: '音声 / TTS対応', audioPremium: 'プレミアム音声', unlockPremium24h: '24時間プレミアムを解除', discoverMore: 'さらに探索', nextDestination: '次の目的地は？',
    mapTitle: 'グエンフエ通り', locating: '現在地を検索中', locatingHelp: 'GPSを許可すると近くのスポットを自動検索します。デモはプロトタイプ発表用です。', enableGps: 'GPSを有効化', gettingGps: 'GPS取得中...', demo: 'デモ', searchPlaceholder: '店舗、食事、名所を検索...', noPoi: '該当するスポットがありません。', yourLocation: '現在地', relocate: '再測位',
    qrOpened: 'QRコードから{name}を開きました。', nearPoi: '{name}の近くです。音声ガイドを開始します。', locationUpdated: '現在地を更新しました。', locationFailed: 'GPSを取得できません。再試行またはデモを選択してください。', demoGpsEnabled: 'プロトタイプ用デモGPSを有効にしました。', demoMoved: 'デモGPSを{name}付近へ移動しました。',
    rating: '評価', freeText: '無料テキストガイド', hideQr: 'QRを隠す', showQr: 'このスポットのQRを表示', scanToOpen: 'スキャンして{name}を開く', qrTracking: 'この体験セッションのスキャン回数を記録します。', readyToPlay: '再生できます', insideRadius: 'スポットの範囲内です。音声を自動再生します。', replay: 'もう一度再生', playingAgain: '音声ガイドを再生しています。', cannotPlay: 'このブラウザでは音声を再生できません。', textOnly: 'テキストのみ。解除するとAI音声を利用できます。', unlockAudio: '音声を解除 - 30,000 VND', browserTts: 'ブラウザ音声', close: '閉じる',
    deviceStatus: '端末の状態', noLogin: 'ログイン不要', premiumPass: 'プレミアムパス', remaining: '残り{time}', audioLockedFree: '無料モードでは音声がロックされています', disablePremiumDemo: 'プレミアムデモを終了', language: '言語', languageHelp: '画面、コンテンツ、音声に適用', gpsStatus: '状態：{status}', clearLocation: '保存位置を削除', locationCleared: 'GPS/デモ位置を削除しました。',
    waiting: '待機中...', playing: '再生中', stopped: '停止', queue: '待機列：{count}スポット', listening: '再生中', noInfo: '情報なし', replayAfter: '再生可能まで：', offline: 'オフラインです。閲覧済みの内容は表示できる場合があります。',
    premiumRemaining: 'プレミアム残り：', upgradePremium: 'プレミアムにアップグレード（24時間）', premiumActivated: 'プレミアムデモを24時間有効にしました。', paymentSuccess: '支払い完了。プレミアムを24時間解除しました。',
    openPremium: 'プレミアムを解除', activateAudio: 'スマート音声を24時間有効化', bank: '銀行', transferContent: '振込内容', paid: '支払い済み'
  },
  ko: {
    smartGuide: '스마트 가이드', explore: '탐색', list: '목록', unlock: '잠금 해제', settings: '설정',
    heroPrefix: '', heroHighlight: 'AI 이야기로 아름다움을 발견하세요', heroDescription: 'GPS 위치에 따라 오디오를 자동 재생합니다. 로그인 없이 편리한 스마트 여행을 경험하세요.',
    startExperience: '체험 시작', requestingGps: 'GPS 권한 요청 중...', demoExperience: '데모 체험', autoGps: '자동 GPS', textAndImages: '텍스트와 이미지', premiumAudio: '프리미엄 오디오',
    gpsReady: 'GPS가 준비되었습니다. 탐색을 시작하세요.', gpsFailed: 'GPS를 가져올 수 없습니다. 권한을 다시 허용하거나 데모를 사용하세요.', demoEnabled: '중심 위치에서 데모 모드를 시작했습니다.', gpsDenied: '위치 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
    inArea: '현재 지역', stallsAndDestinations: '가게와 관광지', audioAvailable: '오디오 / TTS 지원', audioPremium: '프리미엄 오디오', unlockPremium24h: '24시간 프리미엄 잠금 해제', discoverMore: '더 둘러보기', nextDestination: '다음 목적지는 어디인가요?',
    mapTitle: '응우옌후에 거리', locating: '현재 위치 찾는 중', locatingHelp: 'GPS를 허용하면 주변 관광지를 자동으로 찾습니다. 데모는 프로토타입 발표용입니다.', enableGps: 'GPS 켜기', gettingGps: 'GPS 확인 중...', demo: '데모', searchPlaceholder: '가게, 음식, 명소 검색...', noPoi: '일치하는 관광지가 없습니다.', yourLocation: '내 위치', relocate: '다시 찾기',
    qrOpened: 'QR 코드에서 {name}을 열었습니다.', nearPoi: '{name} 근처입니다. 안내를 재생합니다.', locationUpdated: '현재 위치를 업데이트했습니다.', locationFailed: 'GPS를 가져올 수 없습니다. 다시 시도하거나 데모를 선택하세요.', demoGpsEnabled: '프로토타입 데모 GPS를 켰습니다.', demoMoved: '데모 GPS를 {name} 근처로 이동했습니다.',
    rating: '평점', freeText: '무료 텍스트 안내', hideQr: 'QR 숨기기', showQr: '이 관광지 QR 보기', scanToOpen: '스캔하여 {name} 열기', qrTracking: '이번 체험의 QR 스캔 횟수가 기록됩니다.', readyToPlay: '재생 준비 완료', insideRadius: '관광지 범위 안입니다. 오디오가 자동 재생됩니다.', replay: '다시 재생', playingAgain: '안내를 다시 재생합니다.', cannotPlay: '이 브라우저에서 오디오를 재생할 수 없습니다.', textOnly: '텍스트만 제공됩니다. 잠금을 해제하면 AI 음성을 들을 수 있습니다.', unlockAudio: '오디오 잠금 해제 - 30,000 VND', browserTts: '브라우저 TTS', close: '닫기',
    deviceStatus: '기기 상태', noLogin: '로그인 필요 없음', premiumPass: '프리미엄 패스', remaining: '{time} 남음', audioLockedFree: '무료 모드에서는 오디오가 잠겨 있습니다', disablePremiumDemo: '프리미엄 데모 끄기', language: '언어', languageHelp: '화면, 콘텐츠와 음성에 적용', gpsStatus: '상태: {status}', clearLocation: '저장된 위치 삭제', locationCleared: '현재 GPS/데모 위치를 삭제했습니다.',
    waiting: '대기 중...', playing: '재생 중', stopped: '중지됨', queue: '대기열: 관광지 {count}개', listening: '듣는 중', noInfo: '정보 없음', replayAfter: '다시 재생 가능:', offline: '오프라인 상태입니다. 이전에 본 콘텐츠는 계속 표시될 수 있습니다.',
    premiumRemaining: '프리미엄 남은 시간:', upgradePremium: '프리미엄 업그레이드 (24시간)', premiumActivated: '프리미엄 데모가 24시간 활성화되었습니다.', paymentSuccess: '결제가 완료되어 프리미엄이 24시간 잠금 해제되었습니다.',
    openPremium: '프리미엄 잠금 해제', activateAudio: '스마트 오디오 24시간 활성화', bank: '은행', transferContent: '송금 내용', paid: '결제 완료'
  }
};

function interpolate(value, variables) {
  return Object.entries(variables).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    value
  );
}

export function translate(language, key, variables = {}) {
  const value = translations[language]?.[key] ?? translations.vi[key] ?? key;
  return interpolate(value, variables);
}

export function useTranslation() {
  const language = useLanguageStore((state) => state.currentLanguage);
  return {
    language,
    t: (key, variables) => translate(language, key, variables)
  };
}
