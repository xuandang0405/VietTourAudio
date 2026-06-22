import fs from 'node:fs/promises';
import path from 'node:path';
import textToSpeech from '@google-cloud/text-to-speech';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

function hasGoogleTts() {
  return Boolean(env.googleTtsKey || env.googleCredentials);
}

async function writeStub(filePath, text) {
  // File giả lập .mp3 cho môi trường dev (không phải audio thật)
  await fs.writeFile(filePath, `STUB_MP3_CONTENT\n${text.slice(0, 200)}`);
}

export async function generateAudio({ narrationId, text, language, voiceId }) {
  const filename = `narration_${narrationId}_${language}.mp3`;
  const absPath = path.resolve(env.uploadDir, 'audio', filename);
  const publicUrl = `${env.publicBaseUrl}/uploads/audio/${filename}`;

  try {
    await fs.mkdir(path.dirname(absPath), { recursive: true });

    if (hasGoogleTts()) {
      const client = new textToSpeech.TextToSpeechClient();
      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: { languageCode: language === 'vi' ? 'vi-VN' : 'en-US', name: voiceId || undefined },
        audioConfig: { audioEncoding: 'MP3' }
      });
      await fs.writeFile(absPath, response.audioContent, 'binary');
    } else {
      await writeStub(absPath, text);
    }

    await prisma.narration.update({
      where: { id: narrationId },
      data: {
        fileUrl: publicUrl,
        audioStatus: 'READY'
      }
    });

    return { ok: true, fileUrl: publicUrl };
  } catch (err) {
    await prisma.narration.update({
      where: { id: narrationId },
      data: {
        audioStatus: 'ERROR'
      }
    });
    return { ok: false, error: err.message };
  }
}
