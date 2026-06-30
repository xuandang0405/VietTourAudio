const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client/src/locales');
const translationsJsPath = path.join(__dirname, 'client/src/i18n/translations.js');

// Parse the translations object manually or using regex
const content = fs.readFileSync(translationsJsPath, 'utf8');

const extractLang = (lang) => {
  const regex = new RegExp(`\\s${lang}:\\s*{([^}]*)}`, 's');
  const match = content.match(regex);
  if (!match) return {};
  
  const block = match[1];
  const obj = {};
  
  // Quick regex to parse keys and values
  const kvRegex = /([a-zA-Z0-9_]+)\s*:\s*'((?:\\'|[^'])*)'/g;
  let m;
  while ((m = kvRegex.exec(block)) !== null) {
    let val = m[2].replace(/\\'/g, "'");
    // Replace {name} with {{name}} for i18next
    val = val.replace(/{([a-zA-Z0-9_]+)}/g, '{{$1}}');
    obj[m[1]] = val;
  }
  return obj;
};

const languages = ['vi', 'en', 'zh', 'ja', 'ko'];

const extraHardcoded = {
  vi: {
    hero_title: 'Khám phá vẻ đẹp qua <span className="text-teal-600">giọng kể AI</span>',
    free_listens: '🎧 {{count}} lượt miễn phí',
    out_of_listens: '🔒 Hết lượt nghe',
    premium_active: '✨ Premium Active',
    close_camera: 'Đóng camera',
    open_camera: 'Mở camera quét QR',
    enter_code_placeholder: 'Nhập mã (VD: PHODIBONGUYENHUE)',
    active_locations: 'Địa điểm đang hoạt động',
    become_partner: 'Trở thành đối tác',
    partner_desc: 'Bạn muốn đưa địa điểm của mình lên hệ thống VietTourAudio?',
    register_now: 'Đăng ký ngay',
    distance_away: 'Cách bạn {{distance}}'
  },
  en: {
    hero_title: 'Discover beauty through <span className="text-teal-600">AI storytelling</span>',
    free_listens: '🎧 {{count}} free plays',
    out_of_listens: '🔒 Out of plays',
    premium_active: '✨ Premium Active',
    close_camera: 'Close camera',
    open_camera: 'Open camera to scan QR',
    enter_code_placeholder: 'Enter code (e.g., PHODIBONGUYENHUE)',
    active_locations: 'Active Locations',
    become_partner: 'Become a Partner',
    partner_desc: 'Want to list your location on VietTourAudio?',
    register_now: 'Register now',
    distance_away: '{{distance}} away'
  },
  zh: {
    hero_title: '通过 <span className="text-teal-600">AI 语音讲解</span> 探索美景',
    free_listens: '🎧 {{count}} 次免费播放',
    out_of_listens: '🔒 播放次数已用完',
    premium_active: '✨ 高级会员已激活',
    close_camera: '关闭相机',
    open_camera: '打开相机扫描 QR',
    enter_code_placeholder: '输入代码（例如：PHODIBONGUYENHUE）',
    active_locations: '活跃地点',
    become_partner: '成为合作伙伴',
    partner_desc: '想将您的地点加入 VietTourAudio 吗？',
    register_now: '立即注册',
    distance_away: '距离 {{distance}}'
  },
  ja: {
    hero_title: '<span className="text-teal-600">AI音声ガイド</span> で美しさを発見',
    free_listens: '🎧 残り {{count}} 回無料',
    out_of_listens: '🔒 無料回数終了',
    premium_active: '✨ プレミアム有効',
    close_camera: 'カメラを閉じる',
    open_camera: 'カメラを開いてQRをスキャン',
    enter_code_placeholder: 'コードを入力（例: PHODIBONGUYENHUE）',
    active_locations: '現在利用可能な場所',
    become_partner: 'パートナーになる',
    partner_desc: 'VietTourAudioにあなたの場所を追加しませんか？',
    register_now: '今すぐ登録',
    distance_away: '距離 {{distance}}'
  },
  ko: {
    hero_title: '<span className="text-teal-600">AI 음성 가이드</span>로 아름다움을 발견하세요',
    free_listens: '🎧 {{count}}회 무료 듣기',
    out_of_listens: '🔒 남은 횟수 없음',
    premium_active: '✨ 프리미엄 활성화됨',
    close_camera: '카메라 닫기',
    open_camera: '카메라를 열어 QR 스캔',
    enter_code_placeholder: '코드 입력 (예: PHODIBONGUYENHUE)',
    active_locations: '현재 이용 가능한 장소',
    become_partner: '파트너 되기',
    partner_desc: 'VietTourAudio에 장소를 등록하시겠습니까?',
    register_now: '지금 등록',
    distance_away: '거리 {{distance}}'
  }
};

languages.forEach(lang => {
  const jsonPath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const extracted = extractLang(lang);
    const extra = extraHardcoded[lang];
    
    data.landing = {
      ...extracted,
      ...extra
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json`);
  }
});

