import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUser(email: string, role: UserRole, displayName: string, password: string) {
  return prisma.user.upsert({
    where: { email },
    update: { role, displayName, status: 'ACTIVE' },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      displayName,
      role,
      status: 'ACTIVE'
    }
  });
}

async function findOrCreateVendor(data: {
  businessName: string;
  ownerEmail: string;
  ownerDisplayName: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  contactPhone: string;
}) {
  const existing = await prisma.vendor.findFirst({ where: { ownerEmail: data.ownerEmail } });
  if (existing) {
    return prisma.vendor.update({ where: { id: existing.id }, data });
  }

  return prisma.vendor.create({ data });
}

async function main() {
  const [superAdmin] = await Promise.all([
    upsertUser('superadmin@viettour.vn', 'SUPER_ADMIN', 'Super Admin', 'Admin@123'),
    upsertUser('admin@viettour.vn', 'ADMIN', 'Admin Operator', 'Admin@123'),
    upsertUser('mod@viettour.vn', 'MODERATOR', 'Moderator', 'Mod@123'),
    upsertUser('finance@viettour.vn', 'FINANCE', 'Finance Admin', 'Finance@123')
  ]);

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 1 },
    update: { name: 'Basic Vendor', monthlyPrice: new Prisma.Decimal('299000.00'), isPremium: false },
    create: {
      id: 1,
      name: 'Basic Vendor',
      monthlyPrice: new Prisma.Decimal('299000.00'),
      isPremium: false,
      maxPois: 3,
      maxImages: 10,
      maxVideos: 1
    }
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 2 },
    update: { name: 'Premium Vendor', monthlyPrice: new Prisma.Decimal('599000.00'), isPremium: true },
    create: {
      id: 2,
      name: 'Premium Vendor',
      monthlyPrice: new Prisma.Decimal('599000.00'),
      isPremium: true,
      maxPois: 10,
      maxImages: 30,
      maxVideos: 3,
      priorityWeight: 10
    }
  });

  const vendorRows = [
    ['Sạp Bánh Mì Phượng', 'phuong@hoian.vn', 'APPROVED', '0901000001'],
    ['Hội quán Trà Đạo Nhật', 'tradao@hoian.vn', 'PENDING', '0901000002'],
    ['Lụa Hội An Truyền Thống', 'lua@hoian.vn', 'APPROVED', '0901000003'],
    ['Đồ Gỗ Mỹ Nghệ Kim Bồng', 'kimbong@hoian.vn', 'PENDING', '0901000004'],
    ['Quán Cao Lầu Bà Bé', 'caolau@hoian.vn', 'APPROVED', '0901000005'],
    ['Tiệm Đèn Lồng Trúc', 'denlong@hoian.vn', 'SUSPENDED', '0901000006']
  ] as const;

  const vendors = [];
  for (const [businessName, ownerEmail, verificationStatus, contactPhone] of vendorRows) {
    const vendor = await findOrCreateVendor({
      businessName,
      ownerEmail,
      ownerDisplayName: businessName.split(' ').slice(-1)[0],
      verificationStatus,
      contactPhone
    });
    vendors.push(vendor);

    await prisma.vendorWallet.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        balance: verificationStatus === 'APPROVED' ? new Prisma.Decimal('850000.00') : new Prisma.Decimal('50000.00'),
        totalTopUp: verificationStatus === 'APPROVED' ? new Prisma.Decimal('1000000.00') : new Prisma.Decimal('50000.00')
      }
    });

    if (verificationStatus === 'APPROVED') {
      await prisma.vendorSubscription.upsert({
        where: { vendorId: vendor.id },
        update: { planId: vendor.id % BigInt(2) === BigInt(0) ? premiumPlan.id : basicPlan.id, status: 'ACTIVE' },
        create: {
          vendorId: vendor.id,
          planId: vendor.id % BigInt(2) === BigInt(0) ? premiumPlan.id : basicPlan.id,
          status: 'ACTIVE',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          autoRenew: true
        }
      });
    }

    const stallName = `${businessName} - điểm chính`;
    const existingStall = await prisma.stall.findFirst({ where: { vendorId: vendor.id, name: stallName } });
    if (!existingStall) {
      await prisma.stall.create({
        data: {
          vendorId: vendor.id,
          name: stallName,
          latitude: 10.775 + Number(vendor.id) * 0.0001,
          longitude: 106.701 + Number(vendor.id) * 0.0001,
          activationRadius: 25,
          status: verificationStatus === 'APPROVED' ? 'ACTIVE' : 'PENDING_REVIEW'
        }
      });
    }
  }

  const pendingVendor = vendors.find((vendor) => vendor.verificationStatus === 'PENDING');
  if (pendingVendor) {
    const existingTopup = await prisma.topUpRequest.findFirst({ where: { vendorId: pendingVendor.id, status: 'PENDING' } });
    if (!existingTopup) {
      await prisma.topUpRequest.create({
        data: {
          vendorId: pendingVendor.id,
          amount: new Prisma.Decimal('300000.00'),
          provider: 'BANK_QR',
          proofImageUrl: 'https://placehold.co/640x480?text=Bank+Proof'
        }
      });
    }
  }

  const approvedVendor = vendors.find((vendor) => vendor.verificationStatus === 'APPROVED');
  if (approvedVendor) {
    const stall = await prisma.stall.findFirst({ where: { vendorId: approvedVendor.id } });
    const existingMedia = await prisma.mediaFile.findFirst({ where: { vendorId: approvedVendor.id, moderationStatus: 'PENDING' } });
    if (!existingMedia) {
      await prisma.mediaFile.create({
        data: {
          vendorId: approvedVendor.id,
          stallId: stall?.id,
          mediaType: 'AUDIO',
          storagePath: 'seed/audio/demo.mp3',
          publicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: BigInt(1024),
          durationSeconds: 40
        }
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.revenueDaily.upsert({
    where: { date_source_provider: { date: today, source: 'TOP_UP', provider: 'BANK_QR' } },
    update: { totalAmount: new Prisma.Decimal('300000.00') },
    create: { date: today, source: 'TOP_UP', provider: 'BANK_QR', totalAmount: new Prisma.Decimal('300000.00') }
  });

  await prisma.auditLog.create({
    data: {
      performedById: superAdmin.id,
      action: 'SEED_READY',
      targetType: 'system',
      targetLabel: 'Initial admin portal seed'
    }
  });

  console.log('Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
