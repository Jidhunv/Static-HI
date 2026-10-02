const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Get or create tenant
    let tenant = await prisma.tenant.findFirst({
      where: { status: 'active' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default-tenant',
          status: 'active',
          defaultB2CMarkup: 25
        }
      });
      console.log(`✅ Created tenant: ${tenant.name}\n`);
    } else {
      console.log(`✅ Using existing tenant: ${tenant.name}\n`);
    }

    // Get or create countries
    const countryMap = {};
    const countryData = [
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'IN', name: 'India' },
      { code: 'GB', name: 'United Kingdom' }
    ];

    for (const country of countryData) {
      let dbCountry = await prisma.country.findFirst({
        where: { code: country.code }
      });
      if (!dbCountry) {
        dbCountry = await prisma.country.create({
          data: {
            code: country.code,
            name: country.name
          }
        });
        console.log(`✅ Created country: ${country.name}`);
      }
      countryMap[country.code] = dbCountry.id;
    }
    console.log();

    // Hotel data
    const hotelData = [
      // Dubai Hotels (10)
      { name: 'Luxury Palace', city: 'Dubai', country: 'AE', stars: 5, code: 'prop-DUB-001' },
      { name: 'Grand Resort', city: 'Dubai', country: 'AE', stars: 4, code: 'prop-DUB-002' },
      { name: 'Royal Crown', city: 'Dubai', country: 'AE', stars: 5, code: 'prop-DUB-003' },
      { name: 'Premium Elite', city: 'Dubai', country: 'AE', stars: 4, code: 'prop-DUB-004' },
      { name: 'Sunset Harbor', city: 'Dubai', country: 'AE', stars: 5, code: 'prop-DUB-005' },
      { name: 'Diamond Tower', city: 'Dubai', country: 'AE', stars: 4, code: 'prop-DUB-006' },
      { name: 'Star Plaza', city: 'Dubai', country: 'AE', stars: 5, code: 'prop-DUB-007' },
      { name: 'Golden Gate', city: 'Dubai', country: 'AE', stars: 4, code: 'prop-DUB-008' },
      { name: 'Majestic Bay', city: 'Dubai', country: 'AE', stars: 5, code: 'prop-DUB-009' },
      { name: 'Prestige Hotel', city: 'Dubai', country: 'AE', stars: 4, code: 'prop-DUB-010' },

      // India Hotels (10)
      { name: 'Taj Elegance', city: 'Mumbai', country: 'IN', stars: 5, code: 'prop-IND-001' },
      { name: 'Gateway Plaza', city: 'Mumbai', country: 'IN', stars: 4, code: 'prop-IND-002' },
      { name: 'Heritage Palace', city: 'Delhi', country: 'IN', stars: 5, code: 'prop-IND-003' },
      { name: 'Modern Towers', city: 'Bangalore', country: 'IN', stars: 4, code: 'prop-IND-004' },
      { name: 'Pearl Residences', city: 'Hyderabad', country: 'IN', stars: 5, code: 'prop-IND-005' },
      { name: 'Oasis Resort', city: 'Goa', country: 'IN', stars: 4, code: 'prop-IND-006' },
      { name: 'Royal Mansion', city: 'Jaipur', country: 'IN', stars: 5, code: 'prop-IND-007' },
      { name: 'City Heights', city: 'Pune', country: 'IN', stars: 4, code: 'prop-IND-008' },
      { name: 'Lakeside Luxury', city: 'Udaipur', country: 'IN', stars: 5, code: 'prop-IND-009' },
      { name: 'Business Park', city: 'Chennai', country: 'IN', stars: 4, code: 'prop-IND-010' },

      // UK Hotels (10)
      { name: 'London Palace', city: 'London', country: 'GB', stars: 5, code: 'prop-UK-001' },
      { name: 'Westminster Court', city: 'London', country: 'GB', stars: 4, code: 'prop-UK-002' },
      { name: 'Manchester Grand', city: 'Manchester', country: 'GB', stars: 5, code: 'prop-UK-003' },
      { name: 'Liverpool Docks', city: 'Liverpool', country: 'GB', stars: 4, code: 'prop-UK-004' },
      { name: 'Edinburgh Castle', city: 'Edinburgh', country: 'GB', stars: 5, code: 'prop-UK-005' },
      { name: 'Glasgow Tower', city: 'Glasgow', country: 'GB', stars: 4, code: 'prop-UK-006' },
      { name: 'Oxford Scholar', city: 'Oxford', country: 'GB', stars: 5, code: 'prop-UK-007' },
      { name: 'Cambridge College', city: 'Cambridge', country: 'GB', stars: 4, code: 'prop-UK-008' },
      { name: 'Bath Spa Resort', city: 'Bath', country: 'GB', stars: 5, code: 'prop-UK-009' },
      { name: 'York Historic', city: 'York', country: 'GB', stars: 4, code: 'prop-UK-010' }
    ];

    let createdCount = 0;
    for (const hotel of hotelData) {
      const existing = await prisma.property.findFirst({
        where: { code: hotel.code }
      });

      if (!existing) {
        await prisma.property.create({
          data: {
            tenantId: tenant.id,
            name: hotel.name,
            code: hotel.code,
            type: 'Hotel',
            countryId: countryMap[hotel.country],
            city: hotel.city,
            address: `${hotel.name} Street, ${hotel.city}`,
            starCategory: hotel.stars,
            latitude: 25.0 + Math.random() * 10,
            longitude: 55.0 + Math.random() * 10,
            phone: '+971-123-4567',
            email: `info@${hotel.name.toLowerCase().replace(/\s/g, '')}.com`,
            checkInTime: '14:00',
            checkOutTime: '11:00',
            description: `${hotel.stars}-star ${hotel.name} in ${hotel.city}. Luxury accommodation with premium amenities.`,
            visibility: 'public_b2c',
            status: 'active'
          }
        });
        createdCount++;
        console.log(`✅ Created: ${hotel.name} - ${hotel.city}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Total hotels created: ${createdCount}`);
    console.log(`✅ Total hotels in database: ${await prisma.property.count()}`);
    console.log(`\n🌱 Database seeding completed successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
