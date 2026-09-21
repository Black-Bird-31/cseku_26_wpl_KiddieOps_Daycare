/**
 * KiddieOps PostgreSQL Database Seed Script (Drizzle ORM)
 * Populates PostgreSQL tables with initial seed users, classrooms, caregivers,
 * children, child_guardians, attendance, activity_logs, complaints, notices, and medical_records.
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
  mediaAssets,
  attendance,
  activityLogs,
  complaints,
  notices,
  medicalRecords
} from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting comprehensive KiddieOps PostgreSQL Database Seeding...");

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
      {
        id: "d3b07384-d113-4a0b-bf3a-96e06b9868e4",
        publicId: "kiddieops/children/samira_avatar",
        secureUrl: "https://images.unsplash.com/photo-1595454223600-91fbdd77e6e3?auto=format&fit=crop&w=400&q=80",
        resourceType: "image",
        format: "jpg",
      },
      {
        id: "d3b07384-d113-4a0b-bf3a-96e06b9868e5",
        publicId: "kiddieops/proof/complaint_proof_01",
        secureUrl: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&w=600&q=80",
        resourceType: "image",
        format: "jpg",
      }
    ]).onConflictDoNothing();

    // 2. Seed Classrooms
    console.log("-> Seeding Classrooms...");
    const existingRooms = await db.select().from(classrooms);
    let roomButterfliesId = existingRooms.find(r => r.name.includes("Butterflies"))?.id;
    let roomExplorersId = existingRooms.find(r => r.name.includes("Explorers"))?.id;

    if (!roomButterfliesId || !roomExplorersId) {
      const inserted = await db.insert(classrooms).values([
        {
          name: "Sunbeam Toddlers (Butterflies)",
          ageRange: "18m – 3y",
        },
        {
          name: "Little Explorers (Preschool)",
          ageRange: "3y – 5y",
        },
      ]).onConflictDoNothing().returning();
      if (inserted[0]) roomButterfliesId = inserted[0].id;
      if (inserted[1]) roomExplorersId = inserted[1].id;
    }

    if (!roomButterfliesId) {
      const allRooms = await db.select().from(classrooms);
      roomButterfliesId = allRooms[0]?.id;
      roomExplorersId = allRooms[1]?.id;
    }

    // 3. Seed Users (Only Main Admin)
    console.log("-> Seeding Users...");
    const adminUserId = "a0000000-0000-0000-0000-000000000001";
    const caregiverUserId = adminUserId;
    const parentUserId = adminUserId;

    await db.insert(users).values([
      {
        id: adminUserId,
        name: "Tanzina Rahman (Principal)",
        email: "admin@kiddieops.com",
        passwordHash: "admin123",
        role: "administrator",
        isActive: true,
      },
    ]).onConflictDoNothing();

    // 4. Seed Caregivers
    console.log("-> Seeding Caregiver Profiles...");
    const caregiverId = "b0000000-0000-0000-0000-000000000001";
    await db.insert(caregivers).values({
      id: caregiverId,
      userId: caregiverUserId,
      contactPhone: "+880 1711-223344",
      contactEmail: "caregiver@kiddieops.com",
      primaryClassroomId: roomButterfliesId,
      isMedicalAuthorized: true,
    }).onConflictDoNothing();

    if (roomButterfliesId) {
      await db.insert(caregiverClassrooms).values({
        caregiverId: caregiverId,
        classroomId: roomButterfliesId,
      }).onConflictDoNothing();
    }

    // 5. Seed Children
    console.log("-> Seeding Children...");
    const child1Id = "c0000000-0000-0000-0000-000000000001";
    const child2Id = "c0000000-0000-0000-0000-000000000002";
    const child3Id = "c0000000-0000-0000-0000-000000000003";

    await db.insert(children).values([
      {
        id: child1Id,
        name: "Anika Rahman",
        dateOfBirth: "2023-04-12",
        classroomId: roomButterfliesId,
        allergyFlag: true,
        emergencyContactName: "Farhana Ahmed",
        emergencyContactPhone: "+880 1819-001122",
        avatarAssetId: "d3b07384-d113-4a0b-bf3a-96e06b9868e1",
      },
      {
        id: child2Id,
        name: "Rohan Chowdhury",
        dateOfBirth: "2022-11-20",
        classroomId: roomExplorersId || roomButterfliesId,
        allergyFlag: false,
        emergencyContactName: "Tariq Chowdhury",
        emergencyContactPhone: "+880 1712-334455",
        avatarAssetId: "d3b07384-d113-4a0b-bf3a-96e06b9868e2",
      },
      {
        id: child3Id,
        name: "Samira Hossain",
        dateOfBirth: "2023-01-15",
        classroomId: roomButterfliesId,
        allergyFlag: false,
        emergencyContactName: "Farhana Ahmed",
        emergencyContactPhone: "+880 1819-001122",
        avatarAssetId: "d3b07384-d113-4a0b-bf3a-96e06b9868e4",
      }
    ]).onConflictDoNothing();

    // Ensure Rohan belongs to roomExplorersId if already inserted
    if (roomExplorersId) {
      await db.update(children).set({ classroomId: roomExplorersId }).where(eq(children.id, child2Id));
    }

    // 6. Seed Child Guardians
    console.log("-> Seeding Child Guardians...");
    await db.insert(childGuardians).values([
      { childId: child1Id, userId: parentUserId, relationshipLabel: "Mother" },
      { childId: child3Id, userId: parentUserId, relationshipLabel: "Mother" },
    ]).onConflictDoNothing();

    // 7. Seed Medical Records
    console.log("-> Seeding Medical Records...");
    await db.insert(medicalRecords).values([
      {
        childId: child1Id,
        allergies: "Severe Peanut & Dairy allergy",
        hasSevereAllergy: true,
        chronicConditions: "Mild asthma triggered by weather change",
        medications: "Albuterol inhaler as needed",
        specialCareInstructions: "Epipen stored in Nurse box #1. Strictly no nuts or cow milk.",
      }
    ]).onConflictDoNothing();

    // 8. Seed Attendance for Today
    console.log("-> Seeding Daily Attendance...");
    const todayStr = new Date().toISOString().split("T")[0];
    await db.insert(attendance).values([
      {
        childId: child1Id,
        date: todayStr,
        status: "present",
        checkInTime: "08:30:00",
        recordedByUserId: caregiverUserId,
        notes: "Checked in on time with mother",
      },
      {
        childId: child2Id,
        date: todayStr,
        status: "late",
        checkInTime: "09:45:00",
        recordedByUserId: caregiverUserId,
        notes: "Traffic on airport road",
      },
      {
        childId: child3Id,
        date: todayStr,
        status: "present",
        checkInTime: "08:40:00",
        recordedByUserId: caregiverUserId,
        notes: "In cheerful mood today",
      },
    ]).onConflictDoNothing();

    // 9. Seed Activity Logs for Today
    console.log("-> Seeding Activity Logs...");
    await db.insert(activityLogs).values([
      {
        childId: child1Id,
        activityType: "meal",
        details: "Morning Snack (Cut Fruits & Oatmeal). Finished 100% portion. Allergen-free served.",
        moodRating: 5,
        durationMinutes: 20,
        loggedByUserId: caregiverUserId,
      },
      {
        childId: child1Id,
        activityType: "nap",
        details: "Afternoon Nap Time. Cribs prepared in quiet zone. Peaceful rest recorded.",
        moodRating: 4,
        durationMinutes: 90,
        loggedByUserId: caregiverUserId,
      },
      {
        childId: child2Id,
        activityType: "play_activity",
        details: "Building blocks and color-matching puzzle session in creative play zone.",
        moodRating: 5,
        durationMinutes: 30,
        loggedByUserId: caregiverUserId,
      },
      {
        childId: child3Id,
        activityType: "learning_activity",
        details: "Phonics and nursery rhyme sing-along with butterfly puppet story.",
        moodRating: 5,
        durationMinutes: 25,
        loggedByUserId: caregiverUserId,
      },
    ]).onConflictDoNothing();

    // 10. Seed Complaints
    console.log("-> Seeding Parent Complaints...");
    await db.insert(complaints).values([
      {
        id: "e0000000-0000-0000-0000-000000000001",
        parentUserId: parentUserId,
        caregiverUserId: caregiverUserId,
        childId: child1Id,
        title: "Delayed Afternoon Snack Notification",
        description: "Snack update was not published until 4 PM. We need real-time dietary updates to ensure Anika's allergy schedule is respected.",
        status: "under_review",
        adminNotes: "Investigating network connectivity issue during afternoon session. Reminded caregiver staff of 15-minute log policy.",
      },
      {
        id: "e0000000-0000-0000-0000-000000000002",
        parentUserId: parentUserId,
        caregiverUserId: caregiverUserId,
        childId: child1Id,
        title: "Minor Knee Scratch during Playground Recess",
        description: "Anika came home with a band-aid on her left knee without an immediate incident notification in the parent portal.",
        status: "resolved",
        adminNotes: "Nurse protocol followed immediately on-site with antiseptic & band-aid. Parent contacted and resolved satisfactorily.",
        resolvedByUserId: adminUserId,
        resolvedAt: new Date(),
      }
    ]).onConflictDoNothing();

    // 11. Seed Notices
    console.log("-> Seeding Center Notices...");
    await db.insert(notices).values([
      {
        id: "f0000000-0000-0000-0000-000000000001",
        title: "Eid-ul-Fitr Holiday Center Closure & Reopening Schedule",
        description: "KiddieOps Daycare Center will observe official closure from April 10 through April 14 for Eid-ul-Fitr holidays. Regular daycare operations resume Monday 8:00 AM.",
        authorUserId: adminUserId,
        classroomId: null,
      },
      {
        id: "f0000000-0000-0000-0000-000000000002",
        title: "Severe Weather Advisory & Outdoor Play Safety Guidelines",
        description: "Due to heavy monsoon rainfall and high humidity, outdoor playground recess will transition to indoor sensory and motor-skill halls until further notice.",
        authorUserId: adminUserId,
        classroomId: null,
      },
      {
        id: "f0000000-0000-0000-0000-000000000003",
        title: "Annual Pediatric Health & Vaccination Checkup Camp",
        description: "Our affiliated pediatrician Dr. Salma Begum will conduct semi-annual health checkups and update child growth charts next Thursday.",
        authorUserId: adminUserId,
        classroomId: roomButterfliesId,
      }
    ]).onConflictDoNothing();

    console.log("✅ Comprehensive PostgreSQL Database Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Database seeding error:", error);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
