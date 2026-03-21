import { PrismaClient, Role, InvestmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.distribution.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.platformSettings.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 12);

  // Create users
  const admin = await prisma.user.create({
    data: { email: 'admin@pooledwealth.com', name: 'Admin', password: hashedPassword, role: Role.ADMIN, kycApproved: true },
  });
  const manager = await prisma.user.create({
    data: { email: 'manager@pooledwealth.com', name: 'Sarah Chen', password: hashedPassword, role: Role.MANAGER, kycApproved: true },
  });
  const investor1 = await prisma.user.create({
    data: { email: 'alice@example.com', name: 'Alice Johnson', password: hashedPassword, role: Role.INVESTOR, kycApproved: true },
  });
  const investor2 = await prisma.user.create({
    data: { email: 'bob@example.com', name: 'Bob Williams', password: hashedPassword, role: Role.INVESTOR, kycApproved: true },
  });
  const investor3 = await prisma.user.create({
    data: { email: 'charlie@example.com', name: 'Charlie Brown', password: hashedPassword, role: Role.INVESTOR, kycApproved: false },
  });

  console.log('✅ Users created');

  // Wallets
  await prisma.wallet.createMany({
    data: [
      { userId: admin.id, balance: 100000 },
      { userId: manager.id, balance: 50000 },
      { userId: investor1.id, balance: 25000 },
      { userId: investor2.id, balance: 10000 },
      { userId: investor3.id, balance: 5000 },
    ],
  });

  console.log('✅ Wallets created');

  // Default platform settings
  await prisma.platformSettings.create({
    data: { managementFeePercent: 2.0, profitSharePercent: 20.0, updatedById: admin.id },
  });

  console.log('✅ Platform settings created');

  // Collectibles investments
  const inv1 = await prisma.investment.create({
    data: {
      title: 'Pokémon Base Set Booster Box — 1st Edition Sealed',
      description:
        'An original 1999 first-edition Pokémon Base Set booster box in pristine sealed condition. Professionally verified and stored in a climate-controlled vault. One of fewer than 2,000 estimated to exist in sealed condition worldwide. This box represents the pinnacle of Pokémon TCG collecting and has consistently outperformed traditional asset classes over the past decade.',
      category: 'Pokemon TCG',
      status: InvestmentStatus.ACTIVE,
      totalUnits: 500,
      availableUnits: 158,
      pricePerUnit: 50,
      minimumUnits: 1,
      targetReturn: 22.5,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2027-01-15'),
      imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800',
      createdById: manager.id,
    },
  });

  const inv2 = await prisma.investment.create({
    data: {
      title: 'Michael Jordan 1986 Fleer Rookie Card — PSA 10 Gem Mint',
      description:
        'The holy grail of basketball cards. This 1986 Fleer Michael Jordan rookie card has been graded PSA 10 Gem Mint — the highest possible grade. With fewer than 300 PSA 10 copies in existence, this card has seen consistent appreciation. Stored in PSA slab with tamper-evident security.',
      category: 'Sports Cards',
      status: InvestmentStatus.ACTIVE,
      totalUnits: 200,
      availableUnits: 22,
      pricePerUnit: 100,
      minimumUnits: 1,
      targetReturn: 18.0,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2026-02-01'),
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      createdById: manager.id,
    },
  });

  const inv3 = await prisma.investment.create({
    data: {
      title: 'Nike Air Jordan 1 Retro High OG "Chicago" 1985 — Deadstock',
      description:
        'An original pair of 1985 Nike Air Jordan 1 "Chicago" colorway in deadstock condition, size 10.5 US. Unworn, with original box, tissue, and hang tags. Authenticated by GOAT and Stadium Goods. The original colorway that started the Jordan legend, these are among the rarest sneakers in existence.',
      category: 'Sneakers',
      status: InvestmentStatus.ACTIVE,
      totalUnits: 1000,
      availableUnits: 390,
      pricePerUnit: 25,
      minimumUnits: 5,
      targetReturn: 15.5,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2026-09-01'),
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      createdById: admin.id,
    },
  });

  const inv4 = await prisma.investment.create({
    data: {
      title: 'Amazing Fantasy #15 (1962) — First Appearance Spider-Man CGC 7.5',
      description:
        'The most iconic comic book in history — Amazing Fantasy #15 featuring the first appearance of Spider-Man. Graded CGC 7.5 VF-, presenting beautifully with bright white pages. Published in August 1962, this is the key investment-grade comic of the Silver Age. Stored in UV-protective CGC holder.',
      category: 'Comics',
      status: InvestmentStatus.ACTIVE,
      totalUnits: 300,
      availableUnits: 300,
      pricePerUnit: 75,
      minimumUnits: 1,
      targetReturn: 12.0,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2029-04-01'),
      imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800',
      createdById: manager.id,
    },
  });

  const inv5 = await prisma.investment.create({
    data: {
      title: 'Rolex Daytona Ref. 6263 "Paul Newman" — Vintage 1974',
      description:
        'A 1974 Rolex Daytona Reference 6263 with the rare "Paul Newman" exotic dial in pristine condition. Complete with original papers, extract from archives, and original bracelet. Serviced by Rolex in 2023. The Paul Newman Daytona is consistently ranked among the most valuable watches in the world at auction.',
      category: 'Watches',
      status: InvestmentStatus.ACTIVE,
      totalUnits: 100,
      availableUnits: 100,
      pricePerUnit: 500,
      minimumUnits: 1,
      targetReturn: 14.0,
      startDate: new Date('2024-05-01'),
      endDate: new Date('2029-05-01'),
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      createdById: admin.id,
    },
  });

  console.log('✅ Assets created');

  // Sample holdings
  await prisma.holding.create({ data: { userId: investor1.id, investmentId: inv1.id, unitsPurchased: 20, purchasePrice: 1000 } });
  await prisma.holding.create({ data: { userId: investor1.id, investmentId: inv2.id, unitsPurchased: 10, purchasePrice: 1000 } });
  await prisma.holding.create({ data: { userId: investor2.id, investmentId: inv1.id, unitsPurchased: 15, purchasePrice: 750 } });
  await prisma.holding.create({ data: { userId: investor2.id, investmentId: inv3.id, unitsPurchased: 50, purchasePrice: 1250 } });

  // Sample transactions
  await prisma.transaction.create({ data: { userId: investor1.id, investmentId: inv1.id, type: 'PURCHASE', units: 20, amount: 1000, status: 'COMPLETED' } });
  await prisma.transaction.create({ data: { userId: investor1.id, investmentId: inv2.id, type: 'PURCHASE', units: 10, amount: 1000, status: 'COMPLETED' } });
  await prisma.transaction.create({ data: { userId: investor2.id, investmentId: inv1.id, type: 'PURCHASE', units: 15, amount: 750, status: 'COMPLETED' } });
  await prisma.transaction.create({ data: { userId: investor2.id, investmentId: inv3.id, type: 'PURCHASE', units: 50, amount: 1250, status: 'COMPLETED' } });

  console.log('✅ Holdings & transactions created');

  console.log(`
🎉 Seed complete!

Test accounts (password: "password"):
  Admin:    admin@pooledwealth.com
  Manager:  manager@pooledwealth.com
  Investor: alice@example.com
  Investor: bob@example.com
  Investor: charlie@example.com (KYC pending)
  `);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
