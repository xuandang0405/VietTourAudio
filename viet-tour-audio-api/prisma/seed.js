import bcrypt from 'bcrypt';
import { PrismaClient, ApprovalStatus, AudioStatus, PaymentStatus, SubscriptionStatus, UserRole, ZoneType } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function main() {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const modHash = await bcrypt.hash('Mod@123', 10);
  const vendorHash = await bcrypt.hash('Vendor@123', 10);

  await prisma.auditLog.deleteMany();
  await prisma.appNotification.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.vendorSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.analytic.deleteMany();
  await prisma.guestFavorite.deleteMany();
  await prisma.qrDeepLink.deleteMany();
  await prisma.narration.deleteMany();
  await prisma.tourZone.deleteMany();
  await prisma.tourTranslation.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.zoneTranslation.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.shopHour.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  const shop1 = await prisma.shop.create({
    data: {
      name: 'Sạp Đồ Cổ Chú Năm',
      slug: 'sap-do-co-chu-nam',
      description: 'Sạp đồ cổ tại phố đi bộ Nguyễn Huệ',
      address: 'Nguyễn Huệ, Quận 1, TP.HCM',
      phoneNumber: '0909000001',
      latitude: 10.7769,
      longitude: 106.7009,
      activationRadius: 12,
      openStatus: true,
      isPremium: true,
      approvalStatus: ApprovalStatus.APPROVED,
      hours: {
        create: Array.from({ length: 7 }).map((_, i) => ({ dayOfWeek: i, openTime: '08:00', closeTime: '22:00', isClosed: false }))
      }
    }
  });

  const shop2 = await prisma.shop.create({
    data: {
      name: 'Sạp Trà Thảo Mộc Cô Lan',
      slug: 'sap-tra-thao-moc-co-lan',
      description: 'Sạp đang chờ duyệt',
      address: 'Nguyễn Huệ, Quận 1, TP.HCM',
      phoneNumber: '0909000002',
      latitude: 10.7764,
      longitude: 106.7012,
      activationRadius: 10,
      openStatus: true,
      approvalStatus: ApprovalStatus.PENDING
    }
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      fullName: 'System Admin',
      email: 'admin@viettouraudio.local',
      isActive: true,
      approvalStatus: ApprovalStatus.APPROVED
    }
  });

  await prisma.user.create({
    data: {
      username: 'mod',
      passwordHash: modHash,
      role: UserRole.MODERATOR,
      fullName: 'Content Moderator',
      email: 'mod@viettouraudio.local',
      isActive: true,
      approvalStatus: ApprovalStatus.APPROVED
    }
  });

  await prisma.user.create({
    data: {
      username: 'vendor1',
      passwordHash: vendorHash,
      role: UserRole.VENDOR,
      fullName: 'Vendor Approved',
      email: 'vendor1@viettouraudio.local',
      shopId: shop1.id,
      isActive: true,
      approvalStatus: ApprovalStatus.APPROVED
    }
  });

  await prisma.user.create({
    data: {
      username: 'vendor2',
      passwordHash: vendorHash,
      role: UserRole.VENDOR,
      fullName: 'Vendor Pending',
      email: 'vendor2@viettouraudio.local',
      shopId: shop2.id,
      isActive: false,
      approvalStatus: ApprovalStatus.PENDING
    }
  });

  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic',
      monthlyPrice: 99000,
      isPremium: false,
      maxZones: 3,
      maxImages: 10,
      maxAudioVariants: 1,
      priorityWeight: 1,
      isActive: true
    }
  });

  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium',
      monthlyPrice: 299000,
      isPremium: true,
      maxZones: 50,
      maxImages: 300,
      maxAudioVariants: 5,
      priorityWeight: 10,
      isActive: true
    }
  });

  await prisma.vendorSubscription.create({
    data: {
      shopId: shop1.id,
      planId: premiumPlan.id,
      status: SubscriptionStatus.ACTIVE,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true
    }
  });

  const tour = await prisma.tour.create({
    data: {
      name: 'Phố đi bộ Nguyễn Huệ',
      slug: 'pho-di-bo-nguyen-hue',
      description: 'Tour đi bộ khu vực trung tâm',
      duration: 45,
      imageUrl: '/uploads/images/tour-nguyen-hue.jpg',
      priceAmount: 30000,
      currency: 'VND',
      isActive: true,
      translations: {
        create: [
          { language: 'vi', name: 'Phố đi bộ Nguyễn Huệ', description: 'Tour đi bộ khám phá Nguyễn Huệ' },
          { language: 'en', name: 'Nguyen Hue Walking Street', description: 'Walking tour in district 1' }
        ]
      }
    }
  });

  const zonePayload = [
    ['Cổng chào Nguyễn Huệ', 10.77691, 106.70095, 10, ZoneType.LANDMARK],
    ['Sạp Đồ Cổ Chú Năm', 10.7769, 106.7009, 12, ZoneType.SHOP],
    ['Góc Cà Phê Di Sản', 10.7767, 106.70105, 9, ZoneType.RESTAURANT],
    ['Khu trình diễn nghệ thuật', 10.77655, 106.70122, 11, ZoneType.OTHER],
    ['Điểm check-in đài phun nước', 10.77635, 106.70135, 10, ZoneType.LANDMARK]
  ];

  const zones = [];
  for (let i = 0; i < zonePayload.length; i += 1) {
    const [name, lat, lng, radius, zoneType] = zonePayload[i];
    const zone = await prisma.zone.create({
      data: {
        shopId: shop1.id,
        name,
        description: `${name} - điểm nổi bật trong tour`,
        latitude: lat,
        longitude: lng,
        radius,
        zoneType,
        isPremium: i % 2 === 0,
        isActive: true,
        orderIndex: i,
        activeTime: 'ALL',
        translations: {
          create: [
            {
              language: 'vi',
              title: name,
              description: `Mô tả tiếng Việt cho ${name}`
            },
            {
              language: 'en',
              title: `EN ${name}`,
              description: `English description for ${name}`
            }
          ]
        }
      }
    });

    zones.push(zone);

    await prisma.tourZone.create({
      data: {
        tourId: tour.id,
        zoneId: zone.id,
        orderIndex: i
      }
    });

    await prisma.narration.create({
      data: {
        zoneId: zone.id,
        language: 'vi',
        text: `Bản thuyết minh tiếng Việt cho ${name}`,
        voiceId: 'vi-VN-Standard-A',
        fileUrl: `/uploads/audio/narration_${zone.id}_vi.mp3`,
        durationSeconds: 120 + i * 10,
        audioStatus: AudioStatus.READY,
        approvalStatus: ApprovalStatus.APPROVED,
        updatedById: admin.id
      }
    });
  }

  const qrTourToken = randomUUID().replace(/-/g, '');
  await prisma.qrDeepLink.create({
    data: {
      tokenHash: hashToken(qrTourToken),
      tokenPreview: qrTourToken.slice(0, 12),
      targetType: 'tour',
      targetId: tour.id,
      label: 'QR Tour Nguyen Hue',
      isActive: true,
      currentUses: 0
    }
  });

  const qrZoneToken = randomUUID().replace(/-/g, '');
  await prisma.qrDeepLink.create({
    data: {
      tokenHash: hashToken(qrZoneToken),
      tokenPreview: qrZoneToken.slice(0, 12),
      targetType: 'zone',
      targetId: zones[0].id,
      label: 'QR Zone 1',
      isActive: true,
      currentUses: 0
    }
  });

  const actions = ['QRScan', 'EnterZone', 'ExitZone', 'PlayNarration', 'Favorite', 'GPSWeak'];
  for (let i = 0; i < 50; i += 1) {
    const z = zones[i % zones.length];
    await prisma.analytic.create({
      data: {
        zoneId: z.id,
        shopId: shop1.id,
        tourId: tour.id,
        sessionId: `session-${Math.ceil(i / 3)}`,
        guestId: `guest-${Math.ceil(i / 2)}`,
        latitude: Number(z.latitude) + (Math.random() - 0.5) * 0.0002,
        longitude: Number(z.longitude) + (Math.random() - 0.5) * 0.0002,
        actionType: actions[i % actions.length],
        language: i % 2 === 0 ? 'vi' : 'en',
        metadata: { source: 'seed', n: i }
      }
    });
  }

  for (let i = 0; i < 10; i += 1) {
    await prisma.guestFavorite.create({
      data: {
        guestId: `guest-${i}`,
        zoneId: zones[i % zones.length].id
      }
    });
  }

  const statuses = [PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED];
  for (let i = 0; i < 5; i += 1) {
    await prisma.payment.create({
      data: {
        guestId: `guest-${i}`,
        sessionId: `session-${i}`,
        tourId: tour.id,
        paymentType: i % 2 === 0 ? 'app_premium' : 'tour_unlock',
        provider: 'mock',
        amount: 30000 + i * 5000,
        currency: 'VND',
        status: statuses[i],
        transactionRef: `seed-payment-${i}-${randomUUID().slice(0, 8)}`,
        paidAt: statuses[i] === PaymentStatus.PAID ? new Date() : null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'seed:init',
      entityType: 'system',
      entityId: 'bootstrap',
      reason: 'Initial seed data'
    }
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
