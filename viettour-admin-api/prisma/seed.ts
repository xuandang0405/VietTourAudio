// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Tạo Admin users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@viettour.vn' },
    update: {},
    create: {
      email: 'superadmin@viettour.vn',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN'
    }
  });

  const moderator = await prisma.user.upsert({
    where: { email: 'mod@viettour.vn' },
    update: {},
    create: {
      email: 'mod@viettour.vn',
      passwordHash: await bcrypt.hash('Mod@123', 10),
      displayName: 'Kiểm duyệt viên',
      role: 'MODERATOR'
    }
  });

  // 2. Subscription Plans
  await prisma.subscriptionPlan.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Gói Cơ Bản', monthlyPrice: 299000, isPremium: false, maxPois: 3, maxImages: 10, maxVideos: 1 },
      { name: 'Gói Premium', monthlyPrice: 599000, isPremium: true, maxPois: 10, maxImages: 30, maxVideos: 3, priorityWeight: 10 }
    ]
  });

  // 3. Vendors mẫu (10 vendors — mix trạng thái)
  const plans = await prisma.subscriptionPlan.findMany();
  const vendorData = [
    { name: 'Sạp Bánh Mì Phượng', email: 'phuong@hoian.vn', status: 'APPROVED' },
    { name: 'Hội quán Trà Đạo Nhật', email: 'tradao@hoian.vn', status: 'PENDING' },
    { name: 'Lụa Hội An Truyền Thống', email: 'lua@hoian.vn', status: 'APPROVED' },
    { name: 'Đồ Gỗ Mỹ Nghệ Kim Bồng', email: 'kimbong@hoian.vn', status: 'PENDING' },
    { name: 'Quán Cao Lầu Bà Bé', email: 'caolau@hoian.vn', status: 'APPROVED' },
    { name: 'Tiệm Đèn Lồng Trúc', email: 'denlong@hoian.vn', status: 'SUSPENDED' },
    { name: 'Tour Xuồng Bảy Mẫu', email: 'xuong@hoian.vn', status: 'APPROVED' },
    { name: 'Cà Phê Phố Cổ', email: 'caphe@hoian.vn', status: 'PENDING' },
    { name: 'Áo Dài Thanh Mai', email: 'aodai@hoian.vn', status: 'APPROVED' },
    { name: 'Ẩm Thực Miền Trung', email: 'amthuc@hoian.vn', status: 'REJECTED' },
  ];

  for (const v of vendorData) {
    const vendor = await prisma.vendor.create({
      data: {
        businessName: v.name,
        ownerEmail: v.email,
        ownerDisplayName: v.name.split(' ').pop(),
        verificationStatus: v.status as any,
        contactPhone: `09${Math.floor(10000000 + Math.random() * 90000000)}`
      }
    });

    if (v.status === 'APPROVED') {
      await prisma.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: plans[0].id,
          status: 'ACTIVE',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log('✅ Seed hoàn tất');
}

main().catch(console.error).finally(() => prisma.$disconnect());
