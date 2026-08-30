/**
 * KiddieOps In-Memory Data Store & Seed Records
 * Conforms to `lib/db/schema.ts` and Grounded SRS Requirements (REQ01-REQ10, REQ39).
 */

export interface MediaAssetRecord {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video" | "raw";
  format: string;
  uploadedByUserId?: string;
  uploadedAt: string;
  entityType?: string;
  entityId?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/hashed comparison support
  role: "administrator" | "caregiver" | "parent";
  isActive: boolean;
  avatarAssetId?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomRecord {
  id: string;
  name: string;
  ageRange: string;
}

export interface CaregiverRecord {
  id: string;
  userId: string;
  contactPhone: string;
  contactEmail: string;
  primaryClassroomId?: string;
  isMedicalAuthorized: boolean;
}

export interface ChildRecord {
  id: string;
  name: string;
  dateOfBirth: string;
  classroomId: string;
  classroomName?: string;
  allergyFlag: boolean;
  allergyDetails?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  avatarAssetId?: string;
  avatarUrl?: string;
  guardianIds: string[]; // User IDs of linked parents (child_guardians table)
  guardianRelationship?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintRecord {
  id: string;
  parentUserId: string;
  parentName: string;
  caregiverUserId?: string;
  caregiverName: string;
  childId?: string;
  childName?: string;
  incidentTitle: string;
  incidentDescription: string;
  proofAttachmentUrl?: string;
  status: "pending" | "under_review" | "resolved";
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "urgent" | "holiday";
  targetAudience: "all" | "caregivers" | "parents";
  authorName: string;
  publishedAt: string;
}

// Initial Seed Store
export const initialMediaAssets: MediaAssetRecord[] = [
  {
    id: "media-c1",
    publicId: "kiddieops/children/anika_avatar",
    secureUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "media-c2",
    publicId: "kiddieops/children/rohan_avatar",
    secureUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "media-c3",
    publicId: "kiddieops/children/samira_avatar",
    secureUrl: "https://images.unsplash.com/photo-1595454223600-91fbdd77e6e3?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "media-u1",
    publicId: "kiddieops/users/admin_avatar",
    secureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "media-u2",
    publicId: "kiddieops/users/caregiver_avatar",
    secureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "media-u3",
    publicId: "kiddieops/users/parent_avatar",
    secureUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    resourceType: "image",
    format: "jpg",
    uploadedAt: new Date().toISOString(),
  },
];

export const initialUsers: UserRecord[] = [
  {
    id: "user-admin-01",
    name: "Tanzina Rahman (Principal)",
    email: "admin@kiddieops.com",
    passwordHash: "admin123",
    role: "administrator",
    isActive: true,
    avatarAssetId: "media-u1",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "user-caregiver-01",
    name: "Nusrat Jahan",
    email: "caregiver@kiddieops.com",
    passwordHash: "caregiver123",
    role: "caregiver",
    isActive: true,
    avatarAssetId: "media-u2",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    createdAt: "2026-08-05T08:00:00.000Z",
    updatedAt: "2026-08-05T08:00:00.000Z",
  },
  {
    id: "user-parent-01",
    name: "Farhana Ahmed",
    email: "parent@kiddieops.com",
    passwordHash: "parent123",
    role: "parent",
    isActive: true,
    avatarAssetId: "media-u3",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
  },
  {
    id: "user-parent-farhana",
    name: "Farhana Ahmed",
    email: "farhana@gmail.com",
    passwordHash: "parent123",
    role: "parent",
    isActive: true,
    avatarAssetId: "media-u3",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
  },
  {
    id: "user-parent-02",
    name: "Mahmudul Hasan",
    email: "mahmudul@gmail.com",
    passwordHash: "parent123",
    role: "parent",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    createdAt: "2026-08-12T08:00:00.000Z",
    updatedAt: "2026-08-12T08:00:00.000Z",
  },
];

export const initialClassrooms: ClassroomRecord[] = [
  {
    id: "room-butterflies",
    name: "Sunbeam Toddlers (Butterflies)",
    ageRange: "18 - 36 months",
  },
  {
    id: "room-little-explorers",
    name: "Little Explorers (Preschool)",
    ageRange: "3 - 5 years",
  },
  {
    id: "room-tiny-stars",
    name: "Tiny Stars (Infants)",
    ageRange: "6 - 18 months",
  },
];

export const initialCaregivers: CaregiverRecord[] = [
  {
    id: "cg-01",
    userId: "user-caregiver-01",
    contactPhone: "+880 1711-223344",
    contactEmail: "caregiver@kiddieops.com",
    primaryClassroomId: "room-butterflies",
    isMedicalAuthorized: true,
  },
];

export const initialChildren: ChildRecord[] = [
  {
    id: "child-01",
    name: "Anika Ahmed",
    dateOfBirth: "2023-04-15",
    classroomId: "room-butterflies",
    classroomName: "Sunbeam Toddlers (Butterflies)",
    allergyFlag: true,
    allergyDetails: "Peanut & Dairy hypersensitivity. Keep Epipen ready.",
    emergencyContactName: "Farhana Ahmed (Mother)",
    emergencyContactPhone: "+880 1819-001122",
    avatarAssetId: "media-c1",
    avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    guardianIds: ["user-parent-01"],
    guardianRelationship: "Mother",
    createdAt: "2026-08-11T09:30:00.000Z",
    updatedAt: "2026-08-11T09:30:00.000Z",
  },
  {
    id: "child-02",
    name: "Rohan Hasan",
    dateOfBirth: "2022-11-03",
    classroomId: "room-little-explorers",
    classroomName: "Little Explorers (Preschool)",
    allergyFlag: false,
    emergencyContactName: "Mahmudul Hasan (Father)",
    emergencyContactPhone: "+880 1912-334455",
    avatarAssetId: "media-c2",
    avatarUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80",
    guardianIds: ["user-parent-02"],
    guardianRelationship: "Father",
    createdAt: "2026-08-13T10:15:00.000Z",
    updatedAt: "2026-08-13T10:15:00.000Z",
  },
  {
    id: "child-03",
    name: "Samira Ahmed",
    dateOfBirth: "2024-01-20",
    classroomId: "room-butterflies",
    classroomName: "Sunbeam Toddlers (Butterflies)",
    allergyFlag: false,
    emergencyContactName: "Farhana Ahmed (Mother)",
    emergencyContactPhone: "+880 1819-001122",
    avatarAssetId: "media-c3",
    avatarUrl: "https://images.unsplash.com/photo-1595454223600-91fbdd77e6e3?auto=format&fit=crop&w=400&q=80",
    guardianIds: ["user-parent-01"],
    guardianRelationship: "Mother",
    createdAt: "2026-08-15T11:00:00.000Z",
    updatedAt: "2026-08-15T11:00:00.000Z",
  },
];

export const initialNotices: NoticeRecord[] = [
  {
    id: "notice-01",
    title: "Daycare Closure for Public Holiday & Vaccine Drive",
    content: "Please be advised that the facility will be closed this coming Sunday for routine sanitation and a community vaccination drive.",
    priority: "holiday",
    targetAudience: "all",
    authorName: "Tanzina Rahman (Principal)",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "notice-02",
    title: "Seasonal Weather & Outdoor Play Advisory",
    content: "As temperatures fluctuate this week, please pack a light sweater or rain jacket in your child's cubby for afternoon courtyard playtime.",
    priority: "normal",
    targetAudience: "parents",
    authorName: "Administration",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const initialComplaints: ComplaintRecord[] = [
  {
    id: "comp-101",
    parentUserId: "user-parent-01",
    parentName: "Farhana Ahmed",
    caregiverUserId: "user-caregiver-01",
    caregiverName: "Nusrat Jahan",
    childId: "child-01",
    childName: "Anika Ahmed",
    incidentTitle: "Delay in afternoon nap supervision & sleep cot query",
    incidentDescription: "Parent reported concerns regarding sleep cot location near drafty window.",
    proofAttachmentUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
    status: "under_review",
    resolutionNotes: "Reviewed CCTV footage. Spoke with the caregiver and issued formal counseling. Cot moved to central quiet zone. Parent notified.",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Global in-memory storage manager
class KiddieOpsStore {
  private mediaAssets: MediaAssetRecord[] = [...initialMediaAssets];
  private users: UserRecord[] = [...initialUsers];
  private classrooms: ClassroomRecord[] = [...initialClassrooms];
  private caregivers: CaregiverRecord[] = [...initialCaregivers];
  private children: ChildRecord[] = [...initialChildren];
  private notices: NoticeRecord[] = [...initialNotices];
  private complaints: ComplaintRecord[] = [...initialComplaints];

  // --- Media Asset Methods ---
  getMediaAssets() {
    return [...this.mediaAssets];
  }
  addMediaAsset(asset: MediaAssetRecord) {
    this.mediaAssets.push(asset);
    return asset;
  }

  // --- User Methods (REQ04, REQ05, REQ06, REQ07) ---
  getUsers() {
    return [...this.users];
  }
  getUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }
  getUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  addUser(userData: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): UserRecord {
    const newUser: UserRecord = {
      ...userData,
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }
  updateUser(id: string, updates: Partial<Omit<UserRecord, "id" | "createdAt">>): UserRecord | null {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.users[index];
  }
  deactivateUser(id: string, activeStatus: boolean = false): UserRecord | null {
    return this.updateUser(id, { isActive: activeStatus });
  }
  deleteUser(id: string): boolean {
    const prevLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < prevLen;
  }
  assignUserRole(id: string, role: "administrator" | "caregiver" | "parent"): UserRecord | null {
    return this.updateUser(id, { role });
  }

  // --- Classroom Methods ---
  getClassrooms() {
    return [...this.classrooms];
  }
  getClassroomById(id: string) {
    return this.classrooms.find((c) => c.id === id);
  }

  // --- Caregiver Methods ---
  getCaregivers() {
    return [...this.caregivers];
  }
  getCaregiverByUserId(userId: string) {
    return this.caregivers.find((c) => c.userId === userId);
  }

  // --- Child Methods (REQ08, REQ09, REQ10) ---
  getChildren() {
    return [...this.children];
  }
  getChildById(id: string) {
    return this.children.find((c) => c.id === id);
  }
  /**
   * REQ10: Get only children assigned to a specific parent/guardian
   */
  getChildrenForGuardian(guardianUserId: string): ChildRecord[] {
    return this.children.filter((c) => c.guardianIds.includes(guardianUserId));
  }
  /**
   * REQ08: Add child profile with allergy flag, emergency contact, classroom, photo
   */
  addChild(childData: Omit<ChildRecord, "id" | "createdAt" | "updatedAt">): ChildRecord {
    const classroom = this.classrooms.find((r) => r.id === childData.classroomId);
    const newChild: ChildRecord = {
      ...childData,
      id: `child-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      classroomName: classroom ? classroom.name : "Unassigned Room",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.children.push(newChild);
    return newChild;
  }
  /**
   * REQ09: Update existing child profile
   */
  updateChild(id: string, updates: Partial<Omit<ChildRecord, "id" | "createdAt">>): ChildRecord | null {
    const index = this.children.findIndex((c) => c.id === id);
    if (index === -1) return null;
    let classroomName = this.children[index].classroomName;
    if (updates.classroomId) {
      const cls = this.classrooms.find((r) => r.id === updates.classroomId);
      if (cls) classroomName = cls.name;
    }
    this.children[index] = {
      ...this.children[index],
      ...updates,
      classroomName,
      updatedAt: new Date().toISOString(),
    };
    return this.children[index];
  }
  deleteChild(id: string): boolean {
    const prevLen = this.children.length;
    this.children = this.children.filter((c) => c.id !== id);
    return this.children.length < prevLen;
  }

  // --- Center Notices Methods ---
  getNotices(): NoticeRecord[] {
    return [...this.notices].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
  addNotice(noticeData: Omit<NoticeRecord, "id" | "publishedAt">): NoticeRecord {
    const newNotice: NoticeRecord = {
      ...noticeData,
      id: `notice-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      publishedAt: new Date().toISOString(),
    };
    this.notices.unshift(newNotice);
    return newNotice;
  }
  deleteNotice(id: string): boolean {
    const prevLen = this.notices.length;
    this.notices = this.notices.filter((n) => n.id !== id);
    return this.notices.length < prevLen;
  }

  // --- Parent Complaints Methods (REQ39) ---
  getComplaints(): ComplaintRecord[] {
    return [...this.complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getComplaintsForParent(parentUserId: string): ComplaintRecord[] {
    return this.complaints
      .filter((c) => c.parentUserId === parentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  addComplaint(complaintData: Omit<ComplaintRecord, "id" | "status" | "createdAt">): ComplaintRecord {
    const newComplaint: ComplaintRecord = {
      ...complaintData,
      id: `comp-${Date.now().toString(36).substring(0, 4)}-${Math.random().toString(36).substring(2, 5)}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.complaints.unshift(newComplaint);
    return newComplaint;
  }
  resolveComplaint(id: string, resolutionNotes: string, newStatus: "pending" | "under_review" | "resolved" = "resolved"): ComplaintRecord | null {
    const index = this.complaints.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.complaints[index] = {
      ...this.complaints[index],
      status: newStatus,
      resolutionNotes,
      resolvedAt: newStatus === "resolved" ? new Date().toISOString() : this.complaints[index].resolvedAt,
    };
    return this.complaints[index];
  }
  deleteComplaint(id: string): boolean {
    const prevLen = this.complaints.length;
    this.complaints = this.complaints.filter((c) => c.id !== id);
    return this.complaints.length < prevLen;
  }

  // Reset to initial seed state
  reset() {
    this.mediaAssets = [...initialMediaAssets];
    this.users = [...initialUsers];
    this.classrooms = [...initialClassrooms];
    this.caregivers = [...initialCaregivers];
    this.children = [...initialChildren];
    this.notices = [...initialNotices];
    this.complaints = [...initialComplaints];
  }
}

// Global singleton
const globalStoreKey = Symbol.for("kiddieops.store");
const globalObj = globalThis as unknown as { [globalStoreKey]?: KiddieOpsStore };

if (!globalObj[globalStoreKey]) {
  globalObj[globalStoreKey] = new KiddieOpsStore();
}

export const store = globalObj[globalStoreKey]!;
