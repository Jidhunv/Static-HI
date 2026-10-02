import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // The seed creates accounts with well-known demo passwords.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo accounts in production');
  }

  console.log('🌱 Seeding database...');

  // ========================================================================
  // PLATFORM ADMIN
  // ========================================================================

  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

  await prisma.platformAdmin.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      password: hashPassword('admin123'),
      name: 'Platform Admin',
      role: 'superadmin',
    },
  });

  console.log('✓ Platform admin created');

  // ========================================================================
  // PLATFORM MASTERS
  // ========================================================================

  // Countries
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: { code: 'US', name: 'United States' },
    }),
    prisma.country.upsert({
      where: { code: 'IN' },
      update: {},
      create: { code: 'IN', name: 'India' },
    }),
    prisma.country.upsert({
      where: { code: 'GB' },
      update: {},
      create: { code: 'GB', name: 'United Kingdom' },
    }),
    prisma.country.upsert({
      where: { code: 'SG' },
      update: {},
      create: { code: 'SG', name: 'Singapore' },
    }),
  ]);

  console.log('✓ Countries seeded');

  // States (sample for US and India)
  await Promise.all([
    prisma.state.upsert({
      where: { countryId_name: { countryId: countries[0].id, name: 'New York' } },
      update: {},
      create: { countryId: countries[0].id, name: 'New York', code: 'NY' },
    }),
    prisma.state.upsert({
      where: { countryId_name: { countryId: countries[0].id, name: 'California' } },
      update: {},
      create: { countryId: countries[0].id, name: 'California', code: 'CA' },
    }),
    prisma.state.upsert({
      where: { countryId_name: { countryId: countries[1].id, name: 'Maharashtra' } },
      update: {},
      create: { countryId: countries[1].id, name: 'Maharashtra', code: 'MH' },
    }),
    prisma.state.upsert({
      where: { countryId_name: { countryId: countries[1].id, name: 'Karnataka' } },
      update: {},
      create: { countryId: countries[1].id, name: 'Karnataka', code: 'KA' },
    }),
  ]);

  console.log('✓ States seeded');

  // Currencies
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0 },
    }),
    prisma.currency.upsert({
      where: { code: 'INR' },
      update: {},
      create: { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.0 },
    }),
    prisma.currency.upsert({
      where: { code: 'GBP' },
      update: {},
      create: { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79 },
    }),
    prisma.currency.upsert({
      where: { code: 'SGD' },
      update: {},
      create: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRate: 1.35 },
    }),
  ]);

  console.log('✓ Currencies seeded');

  // ========================================================================
  // FX RATES & HISTORICAL DATA (NEW)
  // ========================================================================

  console.log('💱 Creating FX rates...');

  const usd = currencies.find((c) => c.code === 'USD')!;
  const inr = currencies.find((c) => c.code === 'INR')!;
  const gbp = currencies.find((c) => c.code === 'GBP')!;
  const sgd = currencies.find((c) => c.code === 'SGD')!;

  // Create base FX rates
  const baseRates = [
    { base: usd, quote: inr, rate: 83.15 },
    { base: usd, quote: gbp, rate: 0.7892 },
    { base: usd, quote: sgd, rate: 1.35 },
    { base: gbp, quote: inr, rate: 105.25 },
    { base: sgd, quote: inr, rate: 61.59 },
  ];

  const fxRates = await Promise.all(
    baseRates.map((br) =>
      prisma.fXRate.upsert({
        where: {
          baseCurrencyId_quoteCurrencyId: {
            baseCurrencyId: br.base.id,
            quoteCurrencyId: br.quote.id,
          },
        },
        update: {
          rate: new Decimal(br.rate.toString()),
          source: 'manual',
        },
        create: {
          baseCurrencyId: br.base.id,
          quoteCurrencyId: br.quote.id,
          rate: new Decimal(br.rate.toString()),
          source: 'manual',
        },
      })
    )
  );

  console.log(`✓ Created ${fxRates.length} FX rates`);

  // ========================================================================
  // HISTORICAL FX RATE DATA (Last 30 days)
  // ========================================================================

  console.log('📊 Creating 30 days of historical rate data...');

  let historyCount = 0;
  const now = new Date();

  for (const fxRate of fxRates) {
    // Generate historical entries for each rate
    const daysOfData = 30;

    for (let day = daysOfData; day > 0; day--) {
      // Create 1-3 entries per day to simulate trading activity
      const entriesPerDay = Math.floor(Math.random() * 3) + 1;

      for (let entry = 0; entry < entriesPerDay; entry++) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(Math.floor(Math.random() * 24));
        timestamp.setMinutes(Math.floor(Math.random() * 60));

        // Simulate realistic rate variations (±0.5-2%)
        const baseRate = parseFloat(fxRate.rate.toString());
        const variation = (Math.random() - 0.5) * 0.02; // ±1%
        const historicalRate = baseRate * (1 + variation);

        // Mix of manual and API sources
        const source = Math.random() > 0.6 ? 'api' : 'manual';
        const reasons = ['manual_update', 'api_sync', 'correction', 'daily_update'];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];

        const apiProviders =
          source === 'api' ? ['exchangerate', 'forex_api', 'fixer'] : [null];
        const apiProvider =
          apiProviders[Math.floor(Math.random() * apiProviders.length)];

        try {
          await prisma.fXRateHistory.create({
            data: {
              fxRateId: fxRate.id,
              baseCurrencyId: fxRate.baseCurrencyId,
              quoteCurrencyId: fxRate.quoteCurrencyId,
              rate: new Decimal(historicalRate.toFixed(8)),
              source,
              apiProvider: (apiProvider as string) || undefined,
              updateReason: reason,
              createdAt: timestamp,
            },
          });
          historyCount++;
        } catch (error: any) {
          // Ignore unique constraint errors if entry already exists
          if (!error.message.includes('Unique constraint')) {
            console.log(`Warning: Could not create history entry: ${error.message}`);
          }
        }
      }
    }
  }

  console.log(`✓ Created ${historyCount} historical rate entries`);

  // Amenities
  const amenities = await Promise.all([
    prisma.amenity.upsert({
      where: { code: 'WIFI' },
      update: {},
      create: { code: 'WIFI', name: 'Free Wi-Fi', category: 'connectivity' },
    }),
    prisma.amenity.upsert({
      where: { code: 'AC' },
      update: {},
      create: { code: 'AC', name: 'Air Conditioning', category: 'climate' },
    }),
    prisma.amenity.upsert({
      where: { code: 'PARKING' },
      update: {},
      create: { code: 'PARKING', name: 'Free Parking', category: 'parking' },
    }),
    prisma.amenity.upsert({
      where: { code: 'POOL' },
      update: {},
      create: { code: 'POOL', name: 'Swimming Pool', category: 'entertainment' },
    }),
    prisma.amenity.upsert({
      where: { code: 'GYM' },
      update: {},
      create: { code: 'GYM', name: 'Fitness Center', category: 'wellness' },
    }),
    prisma.amenity.upsert({
      where: { code: 'TV' },
      update: {},
      create: { code: 'TV', name: 'Flat-screen TV', category: 'entertainment' },
    }),
  ]);

  console.log('✓ Amenities seeded');

  // Bed Types
  await Promise.all([
    prisma.bedType.upsert({
      where: { code: 'SINGLE' },
      update: {},
      create: { code: 'SINGLE', name: 'Single' },
    }),
    prisma.bedType.upsert({
      where: { code: 'DOUBLE' },
      update: {},
      create: { code: 'DOUBLE', name: 'Double' },
    }),
    prisma.bedType.upsert({
      where: { code: 'QUEEN' },
      update: {},
      create: { code: 'QUEEN', name: 'Queen' },
    }),
    prisma.bedType.upsert({
      where: { code: 'KING' },
      update: {},
      create: { code: 'KING', name: 'King' },
    }),
    prisma.bedType.upsert({
      where: { code: 'TWIN' },
      update: {},
      create: { code: 'TWIN', name: 'Twin' },
    }),
  ]);

  console.log('✓ Bed types seeded');

  // Board Codes
  await Promise.all([
    prisma.boardCode.upsert({
      where: { code: 'BB' },
      update: {},
      create: { code: 'BB', name: 'Bed & Breakfast', description: 'Room + breakfast' },
    }),
    prisma.boardCode.upsert({
      where: { code: 'HB' },
      update: {},
      create: { code: 'HB', name: 'Half Board', description: 'Room + breakfast + dinner' },
    }),
    prisma.boardCode.upsert({
      where: { code: 'FB' },
      update: {},
      create: { code: 'FB', name: 'Full Board', description: 'Room + all meals' },
    }),
    prisma.boardCode.upsert({
      where: { code: 'RO' },
      update: {},
      create: { code: 'RO', name: 'Room Only', description: 'Room only, no meals' },
    }),
  ]);

  console.log('✓ Board codes seeded');

  // Taxes
  await Promise.all([
    prisma.tax.upsert({
      where: { code: 'VAT' },
      update: {},
      create: { code: 'VAT', name: 'Value Added Tax', percentage: 15, isInclusive: false },
    }),
    prisma.tax.upsert({
      where: { code: 'GST' },
      update: {},
      create: { code: 'GST', name: 'Goods & Services Tax', percentage: 5, isInclusive: false },
    }),
  ]);

  console.log('✓ Taxes seeded');

  // Cancellation Policy Templates
  await prisma.cancellationPolicyTemplate.upsert({
    where: { code: 'STANDARD' },
    update: {},
    create: {
      code: 'STANDARD',
      name: 'Standard Cancellation',
      description: 'Free cancellation up to 7 days before arrival',
      isDefault: true,
    },
  });

  console.log('✓ Cancellation policy templates seeded');

  // Chains
  const chains = await Promise.all([
    prisma.chain.upsert({
      where: { name: 'Marriott' },
      update: {},
      create: { name: 'Marriott' },
    }),
    prisma.chain.upsert({
      where: { name: 'Hilton' },
      update: {},
      create: { name: 'Hilton' },
    }),
    prisma.chain.upsert({
      where: { name: 'ITC' },
      update: {},
      create: { name: 'ITC' },
    }),
  ]);

  console.log('✓ Chains seeded');

  // Legal Info Types
  await Promise.all([
    prisma.legalInformationType.upsert({
      where: { code: 'PAN' },
      update: {},
      create: { code: 'PAN', name: 'PAN Certificate' },
    }),
    prisma.legalInformationType.upsert({
      where: { code: 'GST' },
      update: {},
      create: { code: 'GST', name: 'GST Registration' },
    }),
    prisma.legalInformationType.upsert({
      where: { code: 'TRADE_LICENSE' },
      update: {},
      create: { code: 'TRADE_LICENSE', name: 'Trade License' },
    }),
  ]);

  console.log('✓ Legal information types seeded');

  // ========================================================================
  // GLOBAL HOTEL MASTER
  // ========================================================================

  const globalHotels = await Promise.all([
    prisma.globalHotel.upsert({
      where: { name_country_latitude_longitude: { name: 'The Plaza Hotel', country: 'United States', latitude: 40.763889, longitude: -73.976389 } },
      update: {},
      create: {
        name: 'The Plaza Hotel',
        address: '768 5th Avenue at Central Park South',
        city: 'New York',
        state: 'New York',
        country: 'United States',
        postalCode: '10019',
        latitude: 40.763889,
        longitude: -73.976389,
        starRating: 5,
        chainAffiliation: 'Marriott',
        amenitiesMaster: ['WIFI', 'AC', 'PARKING', 'POOL', 'GYM'],
      },
    }),
    prisma.globalHotel.upsert({
      where: { name_country_latitude_longitude: { name: 'The Oberoi Mumbai', country: 'India', latitude: 19.0176, longitude: 72.8298 } },
      update: {},
      create: {
        name: 'The Oberoi Mumbai',
        address: 'Nariman Point, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400021',
        latitude: 19.0176,
        longitude: 72.8298,
        starRating: 5,
        chainAffiliation: null,
        amenitiesMaster: ['WIFI', 'AC', 'POOL', 'GYM'],
      },
    }),
  ]);

  console.log('✓ Global hotels seeded');

  // ========================================================================
  // SAMPLE TENANTS
  // ========================================================================

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'luxury-hotels-co' },
    update: {},
    create: {
      name: 'Luxury Hotels Co.',
      slug: 'luxury-hotels-co',
      businessType: 'hotel_chain',
      status: 'active',
      primaryCurrency: 'USD',
      primaryColor: '#7c3aed',
      defaultB2BMargin: 15,
      defaultB2CMarkup: 25,
      commissionRate: 5,
      users: {
        create: {
          email: 'admin@luxuryhotels.com',
          password: hashPassword('password123'),
          firstName: 'Alice',
          lastName: 'Admin',
          role: 'admin',
          permissions: ['all'],
          emailVerified: true,
        },
      },
      settings: {
        create: {
          allowedAmenities: amenities.map((a) => a.id),
          allowedCountries: [countries[0].id, countries[1].id],
          bookingWindow: 365,
        },
      },
    },
  });

  console.log('✓ Tenant 1 (Luxury Hotels Co.) created');

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'global-dmcs' },
    update: {},
    create: {
      name: 'Global DMCs',
      slug: 'global-dmcs',
      businessType: 'dmc',
      status: 'active',
      primaryCurrency: 'USD',
      primaryColor: '#06b6d4',
      defaultB2BMargin: 20,
      defaultB2CMarkup: 30,
      commissionRate: 5,
      users: {
        create: {
          email: 'admin@globaldmcs.com',
          password: hashPassword('password123'),
          firstName: 'Bob',
          lastName: 'Admin',
          role: 'admin',
          permissions: ['all'],
          emailVerified: true,
        },
      },
      settings: {
        create: {
          allowedAmenities: amenities.map((a) => a.id),
          allowedCountries: countries.map((c) => c.id),
          bookingWindow: 180,
        },
      },
    },
  });

  console.log('✓ Tenant 2 (Global DMCs) created');

  // ========================================================================
  // SAMPLE PROPERTIES
  // ========================================================================

  const property1 = await prisma.property.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'PLZ-NYC-001' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      globalHotelId: globalHotels[0].id,
      name: 'The Plaza Hotel',
      code: 'PLZ-NYC-001',
      type: 'Hotel',
      countryId: countries[0].id,
      city: 'New York',
      address: '768 5th Avenue at Central Park South',
      postalCode: '10019',
      latitude: 40.763889,
      longitude: -73.976389,
      starCategory: 5,
      chainName: 'Marriott',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      status: 'active',
      allowEarlyCheckIn: true,
      allowLateCheckOut: true,
      allowChildren: 'yes',
      visibility: 'public_both',
      distributionMode: 'open',
      description: 'Iconic luxury hotel at Central Park',
      rooms: {
        create: [
          {
            type: 'Deluxe Room',
            code: 'DELUXE-001',
            quantity: 50,
            area: 45,
            areaUnit: 'sqm',
            minAdults: 1,
            maxAdults: 2,
            maxOccupancy: 2,
            smokingPolicy: 'non-smoking',
          },
          {
            type: 'Suite',
            code: 'SUITE-001',
            quantity: 20,
            area: 80,
            areaUnit: 'sqm',
            minAdults: 1,
            maxAdults: 4,
            maxOccupancy: 4,
            smokingPolicy: 'non-smoking',
          },
        ],
      },
    },
  });

  console.log('✓ Property 1 (The Plaza Hotel) created with rooms');

  // ========================================================================
  // SAMPLE RATE PLANS
  // ========================================================================

  const room1 = await prisma.room.findFirst({
    where: { propertyId: property1.id, code: 'DELUXE-001' },
  });

  const room2 = await prisma.room.findFirst({
    where: { propertyId: property1.id, code: 'SUITE-001' },
  });

  await Promise.all([
    prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property1.id, code: 'BB-DELUXE' } },
      update: {},
      create: {
        propertyId: property1.id,
        roomId: room1?.id,
        code: 'BB-DELUXE',
        name: 'Bed & Breakfast - Deluxe',
        boardType: 'BB',
        status: 'active',
        taxInclusive: true,
      },
    }),
    prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property1.id, code: 'BB-SUITE' } },
      update: {},
      create: {
        propertyId: property1.id,
        roomId: room2?.id,
        code: 'BB-SUITE',
        name: 'Bed & Breakfast - Suite',
        boardType: 'BB',
        status: 'active',
        taxInclusive: true,
      },
    }),
  ]);

  console.log('✓ Rate plans created');

  // ========================================================================
  // SAMPLE CALENDAR RATES
  // ========================================================================

  if (room1 && room2) {
    const ratePlan1 = await prisma.ratePlan.findFirst({
      where: { code: 'BB-DELUXE' },
    });

    const ratePlan2 = await prisma.ratePlan.findFirst({
      where: { code: 'BB-SUITE' },
    });

    if (ratePlan1 && ratePlan2) {
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        await prisma.calendarRate.upsert({
          where: {
            roomId_ratePlanId_date: {
              roomId: room1.id,
              ratePlanId: ratePlan1.id,
              date,
            },
          },
          update: {},
          create: {
            propertyId: property1.id,
            roomId: room1.id,
            ratePlanId: ratePlan1.id,
            date,
            netRate: 200 + (i % 10) * 10, // vary rates based on day
            availability: 50,
            stopSell: false,
          },
        });

        await prisma.calendarRate.upsert({
          where: {
            roomId_ratePlanId_date: {
              roomId: room2.id,
              ratePlanId: ratePlan2.id,
              date,
            },
          },
          update: {},
          create: {
            propertyId: property1.id,
            roomId: room2.id,
            ratePlanId: ratePlan2.id,
            date,
            netRate: 350 + (i % 10) * 15,
            availability: 20,
            stopSell: false,
          },
        });
      }
    }
  }

  console.log('✓ Calendar rates seeded for 30 days');

  // ========================================================================
  // SAMPLE DISTRIBUTION GRANT (B2B)
  // ========================================================================

  await prisma.distributionGrant.upsert({
    where: { sourceTenantId_targetTenantId: { sourceTenantId: tenant1.id, targetTenantId: tenant2.id } },
    update: {},
    create: {
      sourceTenantId: tenant1.id,
      targetTenantId: tenant2.id,
      status: 'approved',
      customB2BMargin: 18, // 18% instead of default 15%
    },
  });

  console.log('✓ Distribution grant created (Luxury Hotels → Global DMCs)');

  // ========================================================================
  // SEEDING SUMMARY
  // ========================================================================

  console.log('\n' + '═'.repeat(70));
  console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Data Summary:');
  console.log('   Platform Admin: 1');
  console.log(`   Countries: ${countries.length}`);
  console.log('   Currencies: 4 (USD, INR, GBP, SGD)');
  console.log(`   FX Rates: ${fxRates.length}`);
  console.log(`   FX Rate History Entries: ${historyCount}`);
  console.log('   Amenities: 6');
  console.log('   Bed Types: 5');
  console.log('   Board Codes: 4');
  console.log('   Tenants: 2 (Luxury Hotels Co., Global DMCs)');
  console.log('   Properties: 1 (The Plaza Hotel)');
  console.log('   Rooms: 2 (Deluxe, Suite)');
  console.log('   Rate Plans: 2');
  console.log('   Calendar Rates: 60 (30 days × 2 rooms)');
  console.log('\n💱 Exchange Rates Setup:');
  console.log('   ✅ USD ↔ INR (83.15)');
  console.log('   ✅ USD ↔ GBP (0.7892)');
  console.log('   ✅ USD ↔ SGD (1.35)');
  console.log('   ✅ GBP ↔ INR (105.25)');
  console.log('   ✅ SGD ↔ INR (61.59)');
  console.log('   📈 Historical data: Last 30 days with realistic variations');
  console.log('\n🔐 Test Credentials:');
  console.log('   Platform Admin:');
  console.log('      Email: admin@platform.com');
  console.log('      Password: admin123');
  console.log('   Tenant 1 (Luxury Hotels Co.):');
  console.log('      Email: admin@luxuryhotels.com');
  console.log('      Password: password123');
  console.log('   Tenant 2 (Global DMCs):');
  console.log('      Email: admin@globaldmcs.com');
  console.log('      Password: password123');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Start the application: npm run dev');
  console.log('   2. Login to admin panel with platform admin credentials');
  console.log('   3. Go to: Admin → Masters → Exchange Rates');
  console.log('   4. Select a currency pair (e.g., USD → INR)');
  console.log('   5. View 30 days of historical data');
  console.log('   6. Test manual rate updates');
  console.log('\n' + '═'.repeat(70) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
