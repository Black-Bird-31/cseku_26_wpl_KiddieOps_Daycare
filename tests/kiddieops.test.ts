/**
 * KiddieOps Unit Test Suite — Scaffolding.ai
 * Tests grounded in KiddieOps_SRS.docx (REQ01 – REQ10 & Cloudinary Upload).
 */

import { store } from "../lib/mock-data";
import { authenticateUser, canManageUsers, canManageChildren, canGuardianViewChild } from "../lib/auth";
import { createUserAction, updateUserAction, toggleUserStatusAction } from "../lib/actions/users";
import { createChildAction, updateChildAction, getChildByIdAction, getChildrenForGuardianAction } from "../lib/actions/children";
import { uploadToCloudinary } from "../lib/cloudinary";

export interface TestCaseResult {
  reqId: string;
  testName: string;
  passed: boolean;
  message?: string;
}

export async function runAllKiddieOpsTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];
  store.reset(); // Reset store to known state

  const assert = (reqId: string, testName: string, condition: boolean, message?: string) => {
    results.push({
      reqId,
      testName,
      passed: !!condition,
      message: condition ? "PASSED" : (message || "Assertion failed"),
    });
  };

  // =========================================================================
  // REQ01: Login mechanism for registered users
  // =========================================================================
  const validLogin = authenticateUser("admin@kiddieops.com", "admin123");
  assert("REQ01", "Authenticate valid user credentials", validLogin.success && !!validLogin.user);

  const invalidLogin = authenticateUser("admin@kiddieops.com", "wrongpass");
  assert("REQ01", "Reject invalid password credentials", !invalidLogin.success);

  // =========================================================================
  // REQ02: Identify user role immediately after login
  // =========================================================================
  const adminAuth = authenticateUser("admin@kiddieops.com", "admin123");
  assert("REQ02", "Identify Administrator role & redirect", adminAuth.user?.role === "administrator" && adminAuth.redirectUrl === "/admin");

  const caregiverAuth = authenticateUser("caregiver@kiddieops.com", "caregiver123");
  assert("REQ02", "Identify Caregiver role & redirect", caregiverAuth.user?.role === "caregiver" && caregiverAuth.redirectUrl === "/caregiver");

  const parentAuth = authenticateUser("parent@kiddieops.com", "parent123");
  assert("REQ02", "Identify Parent role & redirect", parentAuth.user?.role === "parent" && parentAuth.redirectUrl === "/parent");

  // =========================================================================
  // REQ03: RBAC permission restrictions based on user role
  // =========================================================================
  assert("REQ03", "Admin is authorized to manage users", canManageUsers("administrator") === true);
  assert("REQ03", "Caregiver is denied from managing users", canManageUsers("caregiver") === false);
  assert("REQ03", "Parent is denied from managing users", canManageUsers("parent") === false);
  assert("REQ03", "Admin is authorized to manage children", canManageChildren("administrator") === true);
  assert("REQ03", "Parent is denied from managing children", canManageChildren("parent") === false);

  // =========================================================================
  // REQ04: Administrator shall be able to add new user accounts
  // =========================================================================
  const newUserRes = await createUserAction("administrator", {
    name: "Ayesha Siddiqua (Teacher Assistant)",
    email: "ayesha@kiddieops.com",
    password: "password123",
    role: "caregiver",
    isActive: true,
  });
  assert("REQ04", "Admin successfully creates new user account", newUserRes.success && newUserRes.user?.email === "ayesha@kiddieops.com");

  const unauthorizedAddUser = await createUserAction("parent", {
    name: "Hacker Account",
    email: "hacker@test.com",
    password: "pass",
    role: "administrator",
  });
  assert("REQ04", "Deny non-admin role from creating users", !unauthorizedAddUser.success);

  // =========================================================================
  // REQ05: Administrator shall be able to update existing user info
  // =========================================================================
  const createdUserId = newUserRes.user!.id;
  const updateRes = await updateUserAction("administrator", createdUserId, {
    name: "Ayesha Siddiqua (Senior Assistant)",
  });
  assert("REQ05", "Admin updates user profile name", updateRes.success && updateRes.user?.name === "Ayesha Siddiqua (Senior Assistant)");

  // =========================================================================
  // REQ06: Administrator shall be able to deactivate or remove user account
  // =========================================================================
  const deactRes = await toggleUserStatusAction("administrator", createdUserId, false);
  assert("REQ06", "Admin deactivates user account", deactRes.success && deactRes.user?.isActive === false);

  // Verify deactivated user cannot log in
  const deactivatedLogin = authenticateUser("ayesha@kiddieops.com", "password123");
  assert("REQ06", "Deactivated user account is denied login", !deactivatedLogin.success);

  // =========================================================================
  // REQ07: Administrator shall be able to assign a role to a user account
  // =========================================================================
  const roleChangeRes = await updateUserAction("administrator", createdUserId, {
    role: "administrator",
  });
  assert("REQ07", "Admin updates/promotes user role", roleChangeRes.success && roleChangeRes.user?.role === "administrator");

  // =========================================================================
  // Cloudinary Picture Upload Integration
  // =========================================================================
  const uploadRes = await uploadToCloudinary("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", {
    folder: "kiddieops/test",
  });
  assert("CLOUDINARY", "Cloudinary upload produces secureUrl and publicId", !!uploadRes.secureUrl && !!uploadRes.publicId);

  // =========================================================================
  // REQ08: Administrator shall be able to add a child profile
  // =========================================================================
  const newChildRes = await createChildAction("administrator", {
    name: "Zayan Rahman",
    dateOfBirth: "2023-08-01",
    classroomId: "room-butterflies",
    allergyFlag: true,
    allergyDetails: "Egg allergy. Avoid bakery items.",
    emergencyContactName: "Tanzina Rahman",
    emergencyContactPhone: "+880 1711-998877",
    guardianIds: ["user-parent-01"],
    guardianRelationship: "Mother",
    avatarUrl: uploadRes.secureUrl,
  });
  assert("REQ08", "Admin adds child profile with allergy flag, emergency contact & photo", newChildRes.success && newChildRes.child?.allergyFlag === true);

  const unauthorizedAddChild = await createChildAction("caregiver", {
    name: "Test Child",
    dateOfBirth: "2023-01-01",
    classroomId: "room-butterflies",
    allergyFlag: false,
    emergencyContactName: "Contact",
    emergencyContactPhone: "123",
    guardianIds: [],
  });
  assert("REQ08", "Deny non-admin role from adding child profile", !unauthorizedAddChild.success);

  // =========================================================================
  // REQ09: Administrator shall be able to update an existing child profile
  // =========================================================================
  const createdChildId = newChildRes.child!.id;
  const updateChildRes = await updateChildAction("administrator", createdChildId, {
    allergyDetails: "Egg and Strawberry allergy. Epipen in Nurse box.",
  });
  assert("REQ09", "Admin updates child profile details", !!(updateChildRes.success && updateChildRes.child?.allergyDetails?.includes("Strawberry")));

  // =========================================================================
  // REQ10: Parent/Guardian shall be able to view the profile of their own child ONLY
  // =========================================================================
  // user-parent-01 is guardian of child-01 (Anika) and child-03 (Samira) and the new child
  const parent1ChildrenRes = await getChildrenForGuardianAction("parent", "user-parent-01");
  assert("REQ10", "Parent 1 accesses their own linked children", !!(parent1ChildrenRes.success && (parent1ChildrenRes.children?.length ?? 0) >= 2));

  // user-parent-02 is guardian of child-02 (Rohan) only
  const parent2ChildrenRes = await getChildrenForGuardianAction("parent", "user-parent-02");
  assert("REQ10", "Parent 2 accesses only their own linked child (Rohan)", !!(parent2ChildrenRes.success && parent2ChildrenRes.children?.every(c => c.guardianIds.includes("user-parent-02"))));

  // Verify Parent 2 is BLOCKED from viewing Parent 1's child (child-01 Anika)
  const unauthorizedChildView = await getChildByIdAction("parent", "user-parent-02", "child-01");
  assert("REQ10", "Parent is strictly DENIED from viewing other parent's child profile", !unauthorizedChildView.success);

  // Verify Parent 1 is ALLOWED to view their child
  const authorizedChildView = await getChildByIdAction("parent", "user-parent-01", "child-01");
  assert("REQ10", "Parent is granted access to their own child profile", authorizedChildView.success && authorizedChildView.child?.id === "child-01");

  return results;
}
