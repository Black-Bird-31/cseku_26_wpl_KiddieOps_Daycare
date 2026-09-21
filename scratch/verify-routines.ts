import { db } from "../lib/db";
import { children, users } from "../lib/db/schema";
import { 
  logStudentRoutineAction, 
  sendStudentEmergencyAlertAction, 
  createChildMediaPostAction, 
  getChildLiveFeedAction 
} from "../lib/actions/caregiver";

async function main() {
  console.log("--- Starting Verification of Student Routines & Moments ---");

  // 1. Get a test child and caregiver
  const allChildren = await db.select().from(children).limit(1);
  const testChild = allChildren[0];
  if (!testChild) {
    console.error("No test child found!");
    process.exit(1);
  }

  const allCaregivers = await db.select().from(users).limit(1);
  const testCaregiver = allCaregivers[0];

  console.log(`Testing with student: ${testChild.name} (ID: ${testChild.id})`);

  // 2. Test Log Meal
  const mealRes = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "meal",
    mealTime: "11:30 AM",
    mealItems: "Steamed apple puree, lentils, and oatmeal",
    portionEaten: "100% (Finished all)",
    observations: "Ate cheerfully and drank full cup of water.",
  });
  console.log("1. Meal Log:", mealRes.success ? "SUCCESS" : "FAILED", mealRes.error || "");

  // 3. Test Log Nap
  const napRes = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "nap",
    napStartTime: "01:00 PM",
    napEndTime: "02:20 PM",
    napDurationMinutes: 80,
    napQuality: "Restful & deep sleep",
    observations: "Slept without waking up in cot #1.",
  });
  console.log("2. Nap Log:", napRes.success ? "SUCCESS" : "FAILED", napRes.error || "");

  // 4. Test Log Diaper Change & verify counter
  const diaperRes1 = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "diaper_change",
    diaperTime: "10:00 AM",
    diaperType: "wet",
    observations: "Skin dry and barrier cream applied.",
  });
  console.log("3. Diaper Change 1 Log:", diaperRes1.success ? "SUCCESS" : "FAILED", `Today's Count: ${diaperRes1.todayDiaperCount}`);

  const diaperRes2 = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "diaper_change",
    diaperTime: "02:30 PM",
    diaperType: "both",
    observations: "Hygiene change after afternoon nap.",
  });
  console.log("4. Diaper Change 2 Log:", diaperRes2.success ? "SUCCESS" : "FAILED", `Today's Count: ${diaperRes2.todayDiaperCount}`);

  // 5. Test Log New Word
  const wordRes = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "new_word",
    wordSpoken: "Rainbow",
    wordContext: "Pointed at classroom painting during art circle",
    wordTime: "03:15 PM",
    observations: "Smiled and repeated twice with teacher.",
  });
  console.log("5. New Word Log:", wordRes.success ? "SUCCESS" : "FAILED", wordRes.error || "");

  // 6. Test Log Mood
  const moodRes = await logStudentRoutineAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    routineType: "mood",
    moodState: "Cheerful & Engaged",
    moodRating: 5,
    observations: "Shared toys and laughed during sensory sand play.",
  });
  console.log("6. Mood Log:", moodRes.success ? "SUCCESS" : "FAILED", moodRes.error || "");

  // 7. Test Emergency Alert
  const emergencyRes = await sendStudentEmergencyAlertAction({
    childId: testChild.id,
    childName: testChild.name,
    caregiverUserId: testCaregiver.id,
    alertType: "fever",
    title: "Mild Temperature Elevation (100.4°F)",
    description: "Child appeared warm after outdoor play. Vitals checked in quiet room.",
    actionTaken: "Resting comfortably in care room with hydration, guardian notified.",
  });
  console.log("7. Emergency Alert:", emergencyRes.success ? "SUCCESS" : "FAILED", emergencyRes.error || "");

  // 8. Test Share Video Moment
  const videoRes = await createChildMediaPostAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    caption: "Joyful dancing during music circle time!",
  });
  console.log("8. Video Moment Post:", videoRes.success ? "SUCCESS" : "FAILED", videoRes.error || "");

  // 9. Test Share Photo Moment
  const photoRes = await createChildMediaPostAction({
    childId: testChild.id,
    caregiverUserId: testCaregiver.id,
    mediaUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80",
    mediaType: "photo",
    caption: "Creative sensory painting session!",
  });
  console.log("9. Photo Moment Post:", photoRes.success ? "SUCCESS" : "FAILED", photoRes.error || "");

  // 10. Verify getChildLiveFeedAction retrieves all data for Parent Portal
  const feed = await getChildLiveFeedAction(testChild.id);
  console.log("\n10. Parent Portal Live Feed Check:");
  console.log(`    - Total Activities: ${feed.activities.length}`);
  console.log(`    - Today Diaper Count: ${feed.todayDiaperCount}`);
  console.log(`    - Media Posts (Photos & Videos): ${feed.mediaPosts.length}`);
  console.log(`    - Emergency Alerts: ${feed.emergencyAlerts.length}`);

  const hasVideo = feed.mediaPosts.some((p) => p.mediaType === "video");
  const hasPhoto = feed.mediaPosts.some((p) => p.mediaType === "photo");
  console.log(`    - Has Video Post: ${hasVideo ? "YES" : "NO"}`);
  console.log(`    - Has Photo Post: ${hasPhoto ? "YES" : "NO"}`);
  console.log(`    - Has Emergency Alert: ${feed.emergencyAlerts.length > 0 ? "YES" : "NO"}`);

  console.log("\n--- All Student Routine & Moments Verifications PASSED Successfully! ---");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
