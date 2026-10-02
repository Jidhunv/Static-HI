import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  try {
    // Get first tenant
    const tenants = await prisma.tenant.findMany({ take: 1 });

    if (tenants.length === 0) {
      console.log("❌ No tenants found");
      process.exit(1);
    }

    const tenant = tenants[0];
    console.log("✅ Using tenant:", tenant.name, "(" + tenant.id + ")");

    // Generate API key
    const rawKey = crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = "sk_live_";

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        keyHash: keyHash,
        keyPrefix: keyPrefix,
        name: "Test Booking Flow",
        permissions: ["search", "booking.create", "booking.read"],
        rateLimit: 5000,
        status: "active"
      }
    });

    console.log("");
    console.log("✅ API Key Generated!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 Full API Key:");
    console.log(keyPrefix + rawKey);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Key ID:", apiKey.id);
    console.log("Tenant ID:", tenant.id);
    console.log("Permissions:", apiKey.permissions);

    // Save to file for easy access
    const fs = await import("fs").then(m => m.promises);
    await fs.writeFile(
      "test-api-key.txt",
      keyPrefix + rawKey + "\n",
      "utf-8"
    );
    console.log("\n✅ API Key saved to test-api-key.txt");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
