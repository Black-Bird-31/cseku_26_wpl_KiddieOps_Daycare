/**
 * KiddieOps PostgreSQL Database Seed Script (Drizzle ORM)
 * Populates PostgreSQL tables with initial seed users, classrooms, caregivers, and children.
 * 
 * Usage:
 *   npx tsx lib/db/seed.ts
 */

import "dotenv/config";
import { db } from "./index";
import { 
  users, 
  classrooms, 
  caregivers, 
  children, 
  childGuardians, 
  caregiverClassrooms, 
  mediaAssets 
} from "./schema";

export async function seedDatabase() {
  console.log("🌱 Starting KiddieOps PostgreSQL Database Seeding...");

  try {
    // 1. Seed Media Assets
    console.log("-> Seeding Media Assets...");
    await db.insert(mediaAssets).values([
      {
        id: "d3b07384-d113-4a0b-bf3a-96e06b9868e1",
        publicId: "kiddieops/children/anika_avatar",
        secureUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
        resourceType: "image",
        format: "jpg",
      },
      {
        id: "d3b07384-d113-4a0b-bf3a-96e06b9868e2",
        publicId: "kiddieops/children/rohan_avatar",
        secureUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80",
        resourceType: "image",
        format: "jpg",
      },
      {
        id: "d3b07384-d113-4a0b-bf3a-96e06b9868e3",
        publicId: "kiddieops/users/admin_avatar",
        secureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        resourceType: "image",
        format: "jpg",
      },
    ]).onConflictDoNothing();

    // 2. Seed Classrooms
    console.log("-> Seeding Classrooms...");
    const [roomButterflies, roomExplorers] = await db.insert(classrooms).values([
      {
        name: "Sunbeam Toddlers (Butterflies)",
        ageRange: "18m – 3y",
      },
      {
        name: "Little Explorers (Preschool)",
        ageRange: "3y – 5y",
      },
    ]).onConflictDoNothing().returning();

    // 3. Seed Users (Admin, Caregiver, Parent)
    console.log("-> Seeding Users...");
    const [adminUser, caregiverUser, parentUser] = await db.insert(users).values([
      {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Tanzina Rahman (Principal)",
        email: "admin@kiddieops.com",
        passwordHash: "admin123",
        role: "administrator",
        isActive: true,
      },
      {
        id: "a0000000-0000-0000-0000-000000000002",
        name: "Nusrat Jahan (Lead Teacher)",
        email: "caregiver@kiddieops.com",
        passwordHash: "caregiver123",
        role: "caregiver",
        isActive: true,
      },
      {
        id: "a0000000-0000-0000-0000-000000000003",
        name: "Farhana Ahmed (Guardian)",
        email: "parent@kiddieops.com",
        passwordHash: "parent123",
        role: "parent",
        isActive: true,
      },
    ]).onConflictDoNothing().returning();

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Database seeding error:", error);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
