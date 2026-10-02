import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Get first active tenant
  const tenant = await prisma.tenant.findFirst({
    where: { status: 'active' }
  });

  if (!tenant) {
    console.error('No active tenant found');
    process.exit(1);
  }

  // Generate API key
  const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex').substring(0, 32)}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  
  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      keyHash,
      keyPrefix: rawKey.substring(0, 8),
      name: 'Frontend Booking Engine',
      description: 'API key for hotel booking frontend',
      permissions: ['b2c:search', 'b2c:book', 'b2c:view'],
      rateLimit: 10000,
      allowedOrigins: ['http://localhost:3000'],
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }
  });

  console.log('✅ API Key Generated:\n');
  console.log(rawKey);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
