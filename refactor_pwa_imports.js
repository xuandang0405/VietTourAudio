const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client/src');

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
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace import { useTranslation } from '../../i18n/translations';
  const importRegex = /import\s+\{\s*useTranslation\s*\}\s+from\s+['"](?:\.\.\/)+i18n\/translations['"];?/g;
  if (importRegex.test(content)) {
    content = content.replace(importRegex, `import { useTranslation } from 'react-i18next';`);
    changed = true;
  }

  // Replace const { t } = useTranslation(); with const { t } = useTranslation('translation', { keyPrefix: 'landing' });
  // Only do this if it's a PWA file, which we know it is because it imported the custom useTranslation hook!
  if (changed) {
    // some might have const { t } = useTranslation();
    const hookRegex = /const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);/g;
    content = content.replace(hookRegex, `const { t } = useTranslation('translation', { keyPrefix: 'landing' });`);
  }

  // Also some files might just import `translate` function directly.
  const translateImportRegex = /import\s+\{\s*translate\s*\}\s+from\s+['"](?:\.\.\/)+i18n\/translations['"];?/g;
  if (translateImportRegex.test(content)) {
    content = content.replace(translateImportRegex, `import { t } from 'i18next';`);
    // Find all translate(language, 'key', variables) and replace with t('landing.key', variables)
    // Actually, translate() is used in geo.js or data files. Let's see if we need to handle that separately.
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
