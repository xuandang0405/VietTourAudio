const fs = require('fs');
const files = [
  'AdminVendors.jsx',
  'AdminAnalytics.jsx',
  'AdminTopUps.jsx',
  'AdminContent.jsx',
  'AdminVendorAccounts.jsx'
];
const dir = 'C:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/client/src/admin/pages/';

files.forEach(f => {
  if (!fs.existsSync(dir + f)) return;
  let content = fs.readFileSync(dir + f, 'utf8');
  content = content.replace(/eyebrow=\"Vendor management\"/g, "eyebrow={t('vendors.management_subtitle', 'Vendor Management')}");
  content = content.replace(/eyebrow=\"Top-Up management\"/g, "eyebrow={t('admin_topup.management_subtitle', 'Top-Up Management')}");
  content = content.replace(/eyebrow=\"Content moderation\"/g, "eyebrow={t('content.management_subtitle', 'Content Moderation')}");
  content = content.replace(/eyebrow=\"Vendor accounts\"/g, "eyebrow={t('vendor_wallet.management_subtitle', 'Vendor Accounts')}");
  
  // also fix some case sensitivity issues in AdminVendorAccounts.jsx and AdminTopUps.jsx
  content = content.replace(/VENDOR_WALLET\.COL_BALANCE/g, 'vendor_wallet.col_balance');
  content = content.replace(/VENDOR_WALLET\.COL_WARNING/g, 'vendor_wallet.col_warning');
  content = content.replace(/VENDOR_WALLET\.COL_ACTION/g, 'vendor_wallet.col_action');
  
  fs.writeFileSync(dir + f, content);
});
console.log('Fixed eyebrows in Admin pages.');
