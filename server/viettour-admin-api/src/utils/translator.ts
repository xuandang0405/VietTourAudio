export async function translateText(text: string, targetLang: string, sourceLang = 'vi'): Promise<string> {
  if (!text || !text.trim()) return '';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Translate returned HTTP ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((x: any) => x[0]).join('');
  }
  throw new Error('Failed to parse translation response');
}

export async function translateDynamicFields(
  fields: { title: string; description: string },
  targetLangs = ['en', 'ja', 'ko', 'zh']
): Promise<Record<string, { title: string; description: string }>> {
  const result: Record<string, { title: string; description: string }> = {};

  await Promise.all(
    targetLangs.map(async (lang) => {
      try {
        const [titleTrans, descTrans] = await Promise.all([
          translateText(fields.title, lang),
          fields.description ? translateText(fields.description, lang) : Promise.resolve(''),
        ]);
        result[lang] = {
          title: titleTrans,
          description: descTrans,
        };
      } catch (err: any) {
        console.error(`Dynamic translation to ${lang} failed:`, err.message);
        result[lang] = {
          title: '',
          description: '',
        };
      }
    })
  );

  return result;
}
