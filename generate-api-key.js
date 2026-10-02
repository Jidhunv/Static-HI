const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the first tenant
    const tenant = await prisma.tenant.findFirst({
      where: { status: 'active' }
    });

    if (!tenant) {
      console.error('No active tenant found');
      process.exit(1);
    }

    console.log(`📋 Found tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Generate raw key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex').substring(0, 32)}`;
    const keyHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    // Create API key
    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        keyHash,
        keyPrefix,
        name: 'Frontend Booking Engine',
        description: 'API key for hotel booking frontend',
        permissions: ['b2c:search', 'b2c:book', 'b2c:view'],
        rateLimit: 10000,
        allowedOrigins: ['http://localhost:3000'],
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    });

    console.log('\n✅ API Key Generated Successfully!\n');
    console.log('API Key Details:');
    console.log('================');
    console.log(`Key: ${rawKey}`);
    console.log(`Key Prefix: ${apiKey.keyPrefix}`);
    console.log(`Tenant: ${tenant.name}`);
    console.log(`Permissions: ${apiKey.permissions.join(', ')}`);
    console.log(`Rate Limit: ${apiKey.rateLimit} requests/hour`);
    console.log(`Expires: ${apiKey.expiresAt.toISOString()}`);
    console.log('\n⚠️  Save this key securely. You will not be able to see it again!\n');
    console.log('Add to .env.local:');
    console.log(`NEXT_PUBLIC_API_KEY=${rawKey}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
