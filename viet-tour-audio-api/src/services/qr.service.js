import QRCode from 'qrcode';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { maskToken, randomToken, sha256 } from '../utils/crypto.js';

const cooldown = new Map();
const SCAN_COOLDOWN_MS = 20 * 1000;

export async function createQrLink({ targetType, targetId, label, maxUses, expiresAt }) {
  const token = randomToken(20);
  const tokenHash = sha256(token);
  const entity = await prisma.qrDeepLink.create({
    data: {
      tokenHash,
      tokenPreview: maskToken(token),
      targetType,
      targetId: Number(targetId),
      label,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }
  });

  const url = `${env.qrPublicBaseUrl}/${token}`;
  const qrDataUrl = await QRCode.toDataURL(url);
  return { entity, token, url, qrDataUrl };
}

export async function scanQr({ token, sessionId, ipHash }) {
  const tokenHash = sha256(token);
  const item = await prisma.qrDeepLink.findUnique({ where: { tokenHash } });
  if (!item || !item.isActive) return { valid: false, reason: 'QR not found or disabled' };

  if (item.expiresAt && item.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'QR expired' };
  if (item.maxUses && item.currentUses >= item.maxUses) return { valid: false, reason: 'QR max uses reached' };

  const key = `${sessionId || ipHash}:${tokenHash}`;
  const last = cooldown.get(key) || 0;
  const remainingMs = SCAN_COOLDOWN_MS - (Date.now() - last);
  if (remainingMs > 0) {
    return {
      valid: true,
      cooldown: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      targetType: item.targetType,
      targetId: item.targetId
    };
  }

  cooldown.set(key, Date.now());

  await prisma.qrDeepLink.update({
    where: { id: item.id },
    data: { currentUses: { increment: 1 } }
  });

  let data = {};
  if (item.targetType === 'tour') {
    const tour = await prisma.tour.findUnique({
      where: { id: item.targetId },
      include: {
        translations: true,
        tourZones: { include: { zone: true }, orderBy: { orderIndex: 'asc' } }
      }
    });
    data = { tour, zones: tour?.tourZones?.map((tz) => tz.zone) ?? [] };
  } else if (item.targetType === 'zone') {
    data.zone = await prisma.zone.findUnique({ where: { id: item.targetId }, include: { translations: true } });
  } else if (item.targetType === 'shop') {
    data.shop = await prisma.shop.findUnique({ where: { id: item.targetId } });
  }

  return {
    valid: true,
    cooldown: false,
    targetType: item.targetType,
    targetId: item.targetId,
    data
  };
}
