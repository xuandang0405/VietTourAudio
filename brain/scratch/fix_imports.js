const fs = require('fs');
const path = require('path');

// Define path.posix.clean first
path.posix.clean = function(pathStr) {
  const parts = pathStr.split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.' && part !== '') {
      stack.push(part);
    }
  }
  return stack.join('/');
};

const srcDir = 'c:/Users/UNITY/Desktop/VietTourAudio-project-ready-database-integration/client/src';

// List of all moves (old path -> new path, relative to client/src)
const moves = {
  // auth
  'admin/components/AdminGuard.jsx': 'features/auth/components/AdminGuard.jsx',
  'vendor/components/VendorGuard.jsx': 'features/auth/components/VendorGuard.jsx',
  'admin/pages/AdminLoginPage.jsx': 'features/auth/pages/AdminLoginPage.jsx',
  'vendor/pages/VendorLoginPage.jsx': 'features/auth/pages/VendorLoginPage.jsx',
  'store/authStore.js': 'features/auth/stores/authStore.js',
  'store/userStore.js': 'features/auth/stores/userStore.js',
  'services/authService.js': 'features/auth/services/authService.js',
  'admin/pages/AdminAuditLogs.jsx': 'features/auth/pages/AdminAuditLogs.jsx',
  'admin/pages/AdminUsers.jsx': 'features/auth/pages/AdminUsers.jsx',

  // geofence-audio
  'visitor/components/AudioVisualizer.jsx': 'features/geofence-audio/components/AudioVisualizer.jsx',
  'visitor/components/SharedAudioBar.jsx': 'features/geofence-audio/components/SharedAudioBar.jsx',
  'visitor/components/DevGpsPanel.jsx': 'features/geofence-audio/components/DevGpsPanel.jsx',
  'admin/pages/AdminGeofences.jsx': 'features/geofence-audio/pages/AdminGeofences.jsx',
  'hooks/useGeolocation.js': 'features/geofence-audio/hooks/useGeolocation.js',
  'hooks/useAudioQueue.js': 'features/geofence-audio/hooks/useAudioQueue.js',
  'stores/audioStore.js': 'features/geofence-audio/stores/audioStore.js',
  'stores/audioQueueStore.js': 'features/geofence-audio/stores/audioQueueStore.js',
  'stores/locationStore.js': 'features/geofence-audio/stores/locationStore.js',
  'services/visitorTrackingService.js': 'features/geofence-audio/services/visitorTrackingService.js',
  'store/audioQueueStore.js': 'features/geofence-audio/stores/audioQueueStore_backup.js',

  // vendor-wallet
  'admin/pages/AdminTopUps.jsx': 'features/vendor-wallet/pages/AdminTopUps.jsx',
  'admin/pages/AdminVendorAccounts.jsx': 'features/vendor-wallet/pages/AdminVendorAccounts.jsx',
  'admin/pages/AdminVendorDetail.jsx': 'features/vendor-wallet/pages/AdminVendorDetail.jsx',
  'admin/pages/AdminVendors.jsx': 'features/vendor-wallet/pages/AdminVendors.jsx',
  'admin/pages/AdminCommissions.jsx': 'features/vendor-wallet/pages/AdminCommissions.jsx',
  'admin/pages/AdminSubscriptions.jsx': 'features/vendor-wallet/pages/AdminSubscriptions.jsx',
  'admin/pages/AdminRevenue.jsx': 'features/vendor-wallet/pages/AdminRevenue.jsx',
  'vendor/pages/VendorDashboard.jsx': 'features/vendor-wallet/pages/VendorDashboard.jsx',
  'vendor/pages/VendorRevenue.jsx': 'features/vendor-wallet/pages/VendorRevenue.jsx',
  'vendor/pages/VendorStall.jsx': 'features/vendor-wallet/pages/VendorStall.jsx',
  'services/paymentService.js': 'features/vendor-wallet/services/paymentService.js',
  'services/stallService.js': 'features/vendor-wallet/services/stallService.js',
  'stores/premiumStore.js': 'features/vendor-wallet/stores/premiumStore.js',
  'vendor/store/vendorPortalStore.js': 'features/vendor-wallet/stores/vendorPortalStore.js',
  'admin/pages/AdminAnalytics.jsx': 'features/vendor-wallet/pages/AdminAnalytics.jsx',

  // poi
  'visitor/components/PoiBottomSheet.jsx': 'features/poi/components/PoiBottomSheet.jsx',
  'visitor/components/SidebarPoiCard.jsx': 'features/poi/components/SidebarPoiCard.jsx',
  'visitor/components/LeafletMap.jsx': 'features/poi/components/LeafletMap.jsx',
  'visitor/components/QrCameraScanner.jsx': 'features/poi/components/QrCameraScanner.jsx',
  'visitor/pages/LandingPage.jsx': 'features/poi/pages/LandingPage.jsx',
  'visitor/pages/ListPage.jsx': 'features/poi/pages/ListPage.jsx',
  'visitor/pages/MapPage.jsx': 'features/poi/pages/MapPage.jsx',
  'visitor/pages/ZonePage.jsx': 'features/poi/pages/ZonePage.jsx',
  'visitor/pages/SettingsPage.jsx': 'features/poi/pages/SettingsPage.jsx',
  'admin/pages/AdminPois.jsx': 'features/poi/pages/AdminPois.jsx',
  'admin/pages/AdminContent.jsx': 'features/poi/pages/AdminContent.jsx',
  'vendor/pages/VendorPOIs.jsx': 'features/poi/pages/VendorPOIs.jsx',
  'vendor/pages/VendorContent.jsx': 'features/poi/pages/VendorContent.jsx',
  'services/poiService.js': 'features/poi/services/poiService.js',
  'services/uploadService.js': 'features/poi/services/uploadService.js',
};

// Also compile extensions-stripped versions for easier matching
const movesKeys = Object.keys(moves);
const movesNormalized = {};
movesKeys.forEach(k => {
  const normKey = k.replace(/\.(jsx|js)$/, '');
  movesNormalized[normKey] = moves[k].replace(/\.(jsx|js)$/, '');
});

function findOldPath(newPath) {
  for (const [oldPath, currentNewPath] of Object.entries(moves)) {
    if (currentNewPath === newPath) return oldPath;
  }
  return null;
}

function walk(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
    } else {
      if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        files.push(filePath);
      }
    }
  }
  return files;
}

const allFiles = walk(srcDir);

allFiles.forEach(file => {
  const fileRelPath = path.relative(srcDir, file).replace(/\\/g, '/');
  
  // Determine new relative directory of the file
  let newFileRelDir = path.dirname(fileRelPath);
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match relative imports: from '...' or import(...)
  // Handles single quotes, double quotes, backticks
  const importRegex = /(import\s+.*?from\s+['"]|import\(['"]|require\(['"]|from\s+['"])(\.\.?\/[^'"]+)(['"]\)?)/g;

  content = content.replace(importRegex, (match, prefix, importPath, suffix) => {
    // Determine old path of the current file to resolve its imports correctly
    const oldPath = findOldPath(fileRelPath);
    const oldFileRelDir = oldPath ? path.dirname(oldPath) : path.dirname(fileRelPath);
    
    // 1. Determine absolute-like path of import relative to client/src
    let resolvedRelPath = path.posix.clean(path.posix.join(oldFileRelDir, importPath));
    
    // Normalize resolve output: remove leading / if any
    if (resolvedRelPath.startsWith('/')) {
      resolvedRelPath = resolvedRelPath.substring(1);
    }

    // Try finding in movesNormalized
    let matchedKey = null;
    if (movesNormalized[resolvedRelPath]) {
      matchedKey = resolvedRelPath;
    } else {
      // try stripping extension if the import has it or vice versa
      const stripped = resolvedRelPath.replace(/\.(jsx|js)$/, '');
      if (movesNormalized[stripped]) {
        matchedKey = stripped;
      }
    }

    if (matchedKey) {
      const targetNewRelPath = movesNormalized[matchedKey];
      // 2. Compute relative path from newFileRelDir to targetNewRelPath
      let newImportPath = path.posix.relative(newFileRelDir, targetNewRelPath);
      if (!newImportPath.startsWith('.')) {
        newImportPath = './' + newImportPath;
      }
      
      console.log(`[Import Fix] In ${fileRelPath}: ${importPath} -> ${newImportPath}`);
      changed = true;
      return prefix + newImportPath + suffix;
    }

    // Even if the target hasn't moved, the current file might have moved!
    // So we need to recalculate the relative path to the unchanged target file.
    if (oldPath) {
      // The current file moved, so we must compute relative path from newFileRelDir to resolvedRelPath
      let newImportPath = path.posix.relative(newFileRelDir, resolvedRelPath);
      if (!newImportPath.startsWith('.')) {
        newImportPath = './' + newImportPath;
      }

      if (newImportPath !== importPath) {
        console.log(`[File Moved Fix] In ${fileRelPath}: ${importPath} -> ${newImportPath}`);
        changed = true;
        return prefix + newImportPath + suffix;
      }
    }

    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Import refactoring completed successfully.');
