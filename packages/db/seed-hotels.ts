import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface HotelData {
  name: string;
  type: string;
  city: string;
  countryCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  starCategory: number;
  latitude: number;
  longitude: number;
  amenities: string[];
  description: string;
}

const dubaiHotels: HotelData[] = [
  {
    name: "Burj Al Arab Jumeirah",
    type: "Luxury Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "Jumeirah Beach, Dubai",
    phone: "+971 4 301 7777",
    email: "info@burjalarab.com",
    website: "https://www.burjalarab.com",
    starCategory: 5,
    latitude: 25.1393,
    longitude: 55.1854,
    amenities: ["WiFi", "Swimming Pool", "Spa", "Fine Dining", "Beach Access", "Concierge", "24/7 Room Service"],
    description: "World-renowned luxury hotel shaped like a sail on the Arabian Gulf"
  },
  {
    name: "Emirates Palace",
    type: "Luxury Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "West Bay, Dubai",
    phone: "+971 4 301 7777",
    email: "info@emiratespalace.com",
    website: "https://www.emiratespalace.com",
    starCategory: 5,
    latitude: 25.1858,
    longitude: 55.2659,
    amenities: ["WiFi", "Spa", "Private Beach", "Golf Course", "Fine Dining", "Conference Facilities"],
    description: "Iconic palace-style hotel with pristine beachfront and world-class amenities"
  },
  {
    name: "Atlantis The Palm",
    type: "Resort Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "Palm Jumeirah, Dubai",
    phone: "+971 4 426 0000",
    email: "info@atlantisthepalm.com",
    website: "https://www.atlantisthepalm.com",
    starCategory: 5,
    latitude: 25.1167,
    longitude: 55.1279,
    amenities: ["Water Park", "Aquarium", "Beach", "Multiple Pools", "Fine Dining", "Kids Club"],
    description: "Mega resort with underwater theme featuring aquariums and water parks"
  },
  {
    name: "The Venetian Mina Seyahi",
    type: "Resort Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "Marina, Dubai",
    phone: "+971 4 430 7777",
    email: "info@venetian.ae",
    website: "https://www.venetian.ae",
    starCategory: 5,
    latitude: 25.0854,
    longitude: 55.1446,
    amenities: ["Grand Canal", "Gondola Rides", "Shopping", "Fine Dining", "Spa", "Conference Center"],
    description: "Mediterranean-inspired luxury resort with authentic gondola experiences"
  },
  {
    name: "Jumeirah Beach Hotel",
    type: "Beach Resort",
    city: "Dubai",
    countryCode: "AE",
    address: "Jumeirah Beach, Dubai",
    phone: "+971 4 406 8888",
    email: "info@jumeirahbeach.com",
    website: "https://www.jumeirahbeach.com",
    starCategory: 5,
    latitude: 25.1485,
    longitude: 55.1973,
    amenities: ["Private Beach", "Water Sports", "Multiple Pools", "Fine Dining", "Spa", "Kids Club"],
    description: "Wave-shaped iconic beachfront hotel on Jumeirah Beach"
  },
  {
    name: "Madinat Jumeirah",
    type: "Luxury Resort",
    city: "Dubai",
    countryCode: "AE",
    address: "Jumeirah, Dubai",
    phone: "+971 4 348 0000",
    email: "info@madinatjumeirah.com",
    website: "https://www.madinatjumeirah.com",
    starCategory: 5,
    latitude: 25.1408,
    longitude: 55.1795,
    amenities: ["Arabian Architecture", "Waterways", "Private Beach", "Multiple Restaurants", "Spa", "Theater"],
    description: "Arabian-inspired luxury resort with waterways and traditional architecture"
  },
  {
    name: "Armani Hotel Dubai",
    type: "Luxury Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "Downtown Dubai, Dubai",
    phone: "+971 4 888 3888",
    email: "info@armanihotels.com",
    website: "https://www.armanihotels.com",
    starCategory: 5,
    latitude: 25.1972,
    longitude: 55.2744,
    amenities: ["Armani Spa", "Fine Dining", "Lounge Access", "Concierge", "City Views"],
    description: "Ultra-luxury hotel in Burj Khalifa designed by Giorgio Armani"
  },
  {
    name: "The Ritz-Carlton Dubai",
    type: "Luxury Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "JBR Beach, Dubai",
    phone: "+971 4 318 6150",
    email: "info@ritzcarltondubai.com",
    website: "https://www.ritzcarltondubai.com",
    starCategory: 5,
    latitude: 25.0865,
    longitude: 55.1506,
    amenities: ["Private Beach", "Golf Course", "Spa", "Fine Dining", "Water Sports"],
    description: "Iconic luxury beachfront property with championship golf course"
  },
  {
    name: "Park Hyatt Dubai",
    type: "Luxury Hotel",
    city: "Dubai",
    countryCode: "AE",
    address: "Dubai Creek, Dubai",
    phone: "+971 4 602 1234",
    email: "info@hyatt.com",
    website: "https://www.hyatt.com",
    starCategory: 5,
    latitude: 25.2694,
    longitude: 55.2804,
    amenities: ["Marina", "Beach Access", "Spa", "Multiple Restaurants", "Water Sports"],
    description: "Waterfront luxury hotel overlooking Dubai Creek with private beach"
  },
  {
    name: "One&Only The Palm",
    type: "Luxury Resort",
    city: "Dubai",
    countryCode: "AE",
    address: "Palm Jumeirah, Dubai",
    phone: "+971 4 656 5000",
    email: "info@oneandonly.com",
    website: "https://www.oneandonly.com",
    starCategory: 5,
    latitude: 25.1167,
    longitude: 55.1333,
    amenities: ["Private Beach", "Spa", "Fine Dining", "Water Villa", "Yacht Access"],
    description: "Exclusive ultra-luxury resort with private villas and yacht facilities"
  }
];

const indiaHotels: HotelData[] = [
  {
    name: "Taj Mahal Palace Mumbai",
    type: "Heritage Luxury Hotel",
    city: "Mumbai",
    countryCode: "IN",
    address: "Apollo Bandar, Colaba, Mumbai",
    phone: "+91 22 6665 3366",
    email: "info@tajmahalpalace.com",
    website: "https://www.tajmahalpalace.com",
    starCategory: 5,
    latitude: 18.9676,
    longitude: 72.8239,
    amenities: ["Ocean View", "Fine Dining", "Spa", "Concierge", "Heritage Tours"],
    description: "Iconic 100-year-old heritage palace hotel overlooking the Arabian Sea"
  },
  {
    name: "The Oberoi New Delhi",
    type: "Luxury Hotel",
    city: "New Delhi",
    countryCode: "IN",
    address: "Dr. Zakir Hussain Marg, New Delhi",
    phone: "+91 11 4119 0000",
    email: "info@oberoidelhi.com",
    website: "https://www.oberoi.com",
    starCategory: 5,
    latitude: 28.6081,
    longitude: 77.2169,
    amenities: ["Golf Course", "Spa", "Fine Dining", "Garden", "Concierge"],
    description: "Luxury hotel with manicured gardens and championship golf course"
  },
  {
    name: "ITC Grand Chola Chennai",
    type: "Luxury Hotel",
    city: "Chennai",
    countryCode: "IN",
    address: "Sheraton Colony, Chennai",
    phone: "+91 44 2220 0000",
    email: "info@itchotels.in",
    website: "https://www.itchotels.in",
    starCategory: 5,
    latitude: 13.0073,
    longitude: 80.2389,
    amenities: ["Spa", "Fine Dining", "Cultural Center", "Business Facilities"],
    description: "Luxury hotel featuring South Indian architecture and cultural experiences"
  },
  {
    name: "The Leela Palace Bangalore",
    type: "Luxury Palace Hotel",
    city: "Bangalore",
    countryCode: "IN",
    address: "23, Old Airport Road, Bangalore",
    phone: "+91 80 4125 2525",
    email: "info@leelapalacebangalore.com",
    website: "https://www.theleela.com",
    starCategory: 5,
    latitude: 13.1939,
    longitude: 77.7064,
    amenities: ["Spa", "Swimming Pool", "Fine Dining", "Golf Course", "Conference Center"],
    description: "Palace-style luxury hotel with world-class amenities and lush gardens"
  },
  {
    name: "Taj Lake Palace Udaipur",
    type: "Luxury Palace Hotel",
    city: "Udaipur",
    countryCode: "IN",
    address: "Lake Pichola, Udaipur",
    phone: "+91 294 243 5700",
    email: "info@tajlakepalace.com",
    website: "https://www.tajlakepalace.com",
    starCategory: 5,
    latitude: 24.5705,
    longitude: 73.6867,
    amenities: ["Lake Palace", "Fine Dining", "Spa", "Boat Rides", "Cultural Programs"],
    description: "Floating palace on Lake Pichola, an architectural marvel and UNESCO site"
  },
  {
    name: "The Oberoi Rajvilas Jaipur",
    type: "Luxury Spa Resort",
    city: "Jaipur",
    countryCode: "IN",
    address: "Goner Road, Jaipur",
    phone: "+91 141 268 0101",
    email: "info@oberoirajvilas.com",
    website: "https://www.oberoi.com",
    starCategory: 5,
    latitude: 26.7790,
    longitude: 75.8264,
    amenities: ["Ayurveda Spa", "Yoga", "Palace Tours", "Fine Dining", "Gardens"],
    description: "Luxury resort in traditional Rajasthani palace style with wellness programs"
  },
  {
    name: "Vivanta by Taj Connemara Chennai",
    type: "Heritage Luxury Hotel",
    city: "Chennai",
    countryCode: "IN",
    address: "Connemara, Chennai",
    phone: "+91 44 6600 2222",
    email: "info@connemara.com",
    website: "https://www.vivantabytaj.com",
    starCategory: 5,
    latitude: 13.0489,
    longitude: 80.2646,
    amenities: ["Heritage Building", "Fine Dining", "Spa", "Business Facilities"],
    description: "Historic colonial-era hotel with elegant interiors and modern amenities"
  },
  {
    name: "The Leela Goa",
    type: "Luxury Beach Resort",
    city: "Goa",
    countryCode: "IN",
    address: "Mobor Beach, South Goa",
    phone: "+91 832 687 1234",
    email: "info@leelagoa.com",
    website: "https://www.theleela.com",
    starCategory: 5,
    latitude: 15.2558,
    longitude: 73.8009,
    amenities: ["Private Beach", "Water Sports", "Spa", "Fine Dining", "Kids Club"],
    description: "Luxury beachfront resort on Arabian Sea with pristine white sand beaches"
  },
  {
    name: "Taj Exotica Maldives",
    type: "Luxury Island Resort",
    city: "Maldives",
    countryCode: "IN",
    address: "South Male Atoll, Maldives",
    phone: "+960 664 0999",
    email: "info@tajexotica.com",
    website: "https://www.tajexotica.com",
    starCategory: 5,
    latitude: 4.0804,
    longitude: 73.4607,
    amenities: ["Water Villas", "Overwater Spa", "Fine Dining", "Snorkeling", "Yacht Services"],
    description: "Exclusive island resort with overwater villas and world-class diving"
  },
  {
    name: "ITC Grand Central Mumbai",
    type: "Luxury Hotel",
    city: "Mumbai",
    countryCode: "IN",
    address: "Horniman Circle, Mumbai",
    phone: "+91 22 4949 2020",
    email: "info@grandcentral.itchotels.in",
    website: "https://www.itchotels.in",
    starCategory: 5,
    latitude: 18.9670,
    longitude: 72.8343,
    amenities: ["Historic Building", "Fine Dining", "Spa", "Concierge"],
    description: "Victorian-era luxury hotel in historic city center with contemporary amenities"
  }
];

const ukHotels: HotelData[] = [
  {
    name: "Savoy London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Strand, London",
    phone: "+44 20 7836 4343",
    email: "info@savoyhotel.com",
    website: "https://www.savoyhotel.com",
    starCategory: 5,
    latitude: 51.5064,
    longitude: -0.1213,
    amenities: ["River View", "Fine Dining", "Spa", "Theater District", "Concierge"],
    description: "Iconic Thames-side luxury hotel in the heart of London's West End"
  },
  {
    name: "Claridge's London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Brook Street, London",
    phone: "+44 20 7629 8860",
    email: "info@claridges.co.uk",
    website: "https://www.claridges.co.uk",
    starCategory: 5,
    latitude: 51.5163,
    longitude: -0.1490,
    amenities: ["Art Deco Design", "Fine Dining", "Spa", "Fashion District", "Concierge"],
    description: "Art Deco masterpiece in Mayfair, home to royalty and celebrities"
  },
  {
    name: "The Ritz London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Piccadilly, London",
    phone: "+44 20 7493 8181",
    email: "info@theritzlondon.com",
    website: "https://www.theritzlondon.com",
    starCategory: 5,
    latitude: 51.5079,
    longitude: -0.1378,
    amenities: ["Fine Dining", "Courtyard", "Spa", "Shopping District", "Afternoon Tea"],
    description: "Legendary 5-star luxury hotel overlooking Green Park in Piccadilly"
  },
  {
    name: "Dorchester London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Park Lane, London",
    phone: "+44 20 7629 8888",
    email: "info@thedorchester.com",
    website: "https://www.thedorchester.com",
    starCategory: 5,
    latitude: 51.5086,
    longitude: -0.1514,
    amenities: ["Park View", "Fine Dining", "Spa", "Concierge", "Event Space"],
    description: "Historic luxury hotel on Park Lane with views of Hyde Park"
  },
  {
    name: "Four Seasons London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Hamilton Place, London",
    phone: "+44 20 7499 0888",
    email: "info@fourseasonshotels.com",
    website: "https://www.fourseasonshotels.com",
    starCategory: 5,
    latitude: 51.5125,
    longitude: -0.1535,
    amenities: ["Park View", "Spa", "Fine Dining", "Concierge", "Fitness Center"],
    description: "Ultra-luxury hotel in Mayfair with contemporary design and service"
  },
  {
    name: "Mandarin Oriental London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Knightsbridge, London",
    phone: "+44 20 7235 2000",
    email: "info@mandarinoriental.com",
    website: "https://www.mandarinoriental.com",
    starCategory: 5,
    latitude: 51.4989,
    longitude: -0.1574,
    amenities: ["Spa", "Fine Dining", "Shopping District", "Concierge"],
    description: "Luxury hotel in prestigious Knightsbridge with Asian-inspired elegance"
  },
  {
    name: "The Goring London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Beeston Place, London",
    phone: "+44 20 7396 9000",
    email: "info@thegoringhotel.com",
    website: "https://www.thegoringhotel.com",
    starCategory: 5,
    latitude: 51.4977,
    longitude: -0.1405,
    amenities: ["Garden", "Fine Dining", "Spa", "Royal Proximity", "Concierge"],
    description: "Historic luxury hotel near Buckingham Palace with family-run charm"
  },
  {
    name: "Berkeley London",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Wilton Place, London",
    phone: "+44 20 7235 6000",
    email: "info@berkeleyhotel.co.uk",
    website: "https://www.berkeleyhotel.co.uk",
    starCategory: 5,
    latitude: 51.5005,
    longitude: -0.1556,
    amenities: ["Rooftop Pool", "Fine Dining", "Spa", "Fashion District"],
    description: "Luxury hotel in Belgravia with rooftop pool and contemporary style"
  },
  {
    name: "Charing Cross Hotel London",
    type: "Historic Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Strand, London",
    phone: "+44 20 7839 7282",
    email: "info@charingcrosshotel.co.uk",
    website: "https://www.charingcrosshotel.co.uk",
    starCategory: 4,
    latitude: 51.5080,
    longitude: -0.1220,
    amenities: ["Historic Building", "Fine Dining", "River View", "Theater District"],
    description: "Victorian railway hotel with iconic architecture and modern luxury"
  },
  {
    name: "Hilton London Kensington",
    type: "Luxury Hotel",
    city: "London",
    countryCode: "GB",
    address: "Holland Avenue, London",
    phone: "+44 20 7603 3355",
    email: "info@hiltonlondonkensington.com",
    website: "https://www.hilton.com",
    starCategory: 4,
    latitude: 51.4926,
    longitude: -0.1905,
    amenities: ["Museum Quarter", "Fine Dining", "Business Facilities", "Spa"],
    description: "Luxury hotel near Kensington museums and exhibition halls"
  }
];

async function seedHotels() {
  try {
    console.log("🌍 Starting hotel seeding process...\n");

    // Get or create default tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: "default-tenant" },
      update: {},
      create: {
        name: "Default Tenant",
        slug: "default-tenant",
        businessType: "hotel_chain",
        status: "active",
        primaryCurrency: "USD",
      },
    });
    console.log(`✅ Tenant: ${tenant.name}\n`);

    // Get or create countries
    const countries = await Promise.all([
      prisma.country.upsert({
        where: { code: "AE" },
        update: {},
        create: { code: "AE", name: "United Arab Emirates" },
      }),
      prisma.country.upsert({
        where: { code: "IN" },
        update: {},
        create: { code: "IN", name: "India" },
      }),
      prisma.country.upsert({
        where: { code: "GB" },
        update: {},
        create: { code: "GB", name: "United Kingdom" },
      }),
    ]);
    console.log(`✅ Countries created: ${countries.map((c) => c.name).join(", ")}\n`);

    // Combine all hotels with country info
    const allHotels = [
      ...dubaiHotels.map((h) => ({ ...h, countryObj: countries[0] })),
      ...indiaHotels.map((h) => ({ ...h, countryObj: countries[1] })),
      ...ukHotels.map((h) => ({ ...h, countryObj: countries[2] })),
    ];

    console.log(`🏨 Seeding ${allHotels.length} hotels...\n`);

    // Create hotels
    for (const hotelData of allHotels) {
      const property = await prisma.property.upsert({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: `HOTEL-${hotelData.name.replace(/\s+/g, "-").toUpperCase()}-${hotelData.countryCode}`,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          name: hotelData.name,
          code: `HOTEL-${hotelData.name.replace(/\s+/g, "-").toUpperCase()}-${hotelData.countryCode}`,
          type: hotelData.type,
          countryId: hotelData.countryObj.id,
          city: hotelData.city,
          address: hotelData.address,
          postalCode: "00000",
          latitude: hotelData.latitude,
          longitude: hotelData.longitude,
          phone: hotelData.phone,
          email: hotelData.email,
          website: hotelData.website,
          starCategory: hotelData.starCategory,
          amenities: hotelData.amenities,
          description: hotelData.description,
          checkInTime: "14:00",
          checkOutTime: "12:00",
          status: "active",
          visibility: "public_both",
          distributionMode: "open",
        },
      });

      // Create sample rooms
      await Promise.all(
        [
          { type: "Standard Room", rate: 100, occupancy: 2, count: 20 },
          { type: "Deluxe Room", rate: 150, occupancy: 3, count: 15 },
          { type: "Suite", rate: 250, occupancy: 4, count: 10 },
          { type: "Presidential Suite", rate: 500, occupancy: 6, count: 2 },
        ].map((roomType) =>
          prisma.room.create({
            data: {
              propertyId: property.id,
              name: roomType.type,
              code: `ROOM-${roomType.type.replace(/\s+/g, "-").toUpperCase()}`,
              roomNumber: `${roomType.type.charAt(0)}001`,
              type: roomType.type,
              maxOccupancy: roomType.occupancy,
              baseRate: roomType.rate,
              status: "active",
            },
          }).catch(() => null) // Ignore duplicate errors
        )
      );

      // Create rate plan
      await prisma.ratePlan.upsert({
        where: {
          propertyId_code: {
            propertyId: property.id,
            code: `RP-STD-${hotelData.countryCode}`,
          },
        },
        update: {},
        create: {
          propertyId: property.id,
          code: `RP-STD-${hotelData.countryCode}`,
          name: "Standard Rate Plan",
          boardType: "BB",
          currency: "USD",
          minOccupancy: 1,
          maxOccupancy: 6,
          status: "active",
        },
      }).catch(() => null); // Ignore duplicate errors

      console.log(`  ✓ ${hotelData.name} (${hotelData.city}, ${hotelData.countryCode})`);
    }

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`📊 Total hotels created: ${allHotels.length}`);
    console.log(`   - Dubai: 10 hotels`);
    console.log(`   - India: 10 hotels`);
    console.log(`   - UK: 10 hotels`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedHotels();
