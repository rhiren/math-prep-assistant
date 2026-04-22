import {
  collectionGroup,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type {
  DataTransferServiceContract,
  ProgressService,
  SessionService,
  StudentProfileService,
} from "./contracts";
import {
  getProgressSnapshotLastModified,
  type ProgressSnapshot,
  validateProgressSnapshot,
} from "./dataTransferService";
import type { StudentProfile } from "../domain/models";
import { db } from "./firebase";
import { normalizeStudentProfile } from "./studentProfileService";

const LEGACY_PROGRESS_SYNC_USER_ID = "daughter-1";
const STUDENT_ROSTER_SYNC_PATH = ["sync", "student_roster"] as const;

export type ProgressSyncStatus = "offline" | "syncing" | "synced";

export interface CloudProgressDocument {
  appVersion: string;
  lastModified: string;
  syncedAt: string;
  snapshot: ProgressSnapshot;
}

export interface CloudStudentProfileDocument {
  studentId: string;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
  homeGrade?: string;
  gradeLevel?: string;
  placementProfile?: StudentProfile["placementProfile"];
  profileType?: StudentProfile["profileType"];
  featureFlags?: StudentProfile["featureFlags"];
}

export interface CloudStudentRosterDocument {
  profiles: CloudStudentProfileDocument[];
  syncedAt: string;
}

export interface ProgressSyncClient {
  isReady(): boolean;
  saveProgressToCloud(studentId: string, progressData: ProgressSnapshot): Promise<void>;
  loadProgressFromCloud(studentId: string): Promise<CloudProgressDocument | null>;
}

export interface StudentProfileSyncClient {
  isReady(): boolean;
  listProfilesFromCloud(): Promise<StudentProfile[]>;
  saveProfileToCloud(profile: StudentProfile): Promise<void>;
  deleteProfileFromCloud(studentId: string): Promise<void>;
}

type ProgressSyncListener = (status: ProgressSyncStatus) => void;

function hasSnapshotData(snapshot: ProgressSnapshot): boolean {
  return (
    snapshot.data.sessions.length > 0 ||
    snapshot.data.attempts.length > 0 ||
    snapshot.data.progress.length > 0
  );
}

function isCloudProgressDocument(value: unknown): value is CloudProgressDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.appVersion === "string" &&
    typeof candidate.lastModified === "string" &&
    typeof candidate.syncedAt === "string" &&
    typeof candidate.snapshot === "object" &&
    candidate.snapshot !== null
  );
}

function parseCloudProgressDocument(value: unknown): CloudProgressDocument | null {
  if (!isCloudProgressDocument(value)) {
    return null;
  }

  return {
    ...value,
    snapshot: validateProgressSnapshot(value.snapshot),
  };
}

function sanitizeProgressSnapshotForCloud<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeProgressSnapshotForCloud(item)) as T;
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue !== "undefined")
      .map(([key, entryValue]) => [key, sanitizeProgressSnapshotForCloud(entryValue)]),
  ) as T;
}

function isCloudStudentProfileDocument(value: unknown): value is CloudStudentProfileDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.studentId === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.lastActiveAt === "string"
  );
}

function parseCloudStudentProfileDocument(value: unknown): StudentProfile | null {
  if (!isCloudStudentProfileDocument(value)) {
    return null;
  }

  return normalizeStudentProfile({
    ...value,
    isActive: false,
  });
}

function buildCloudStudentProfileDocument(profile: StudentProfile): CloudStudentProfileDocument {
  return {
    studentId: profile.studentId,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
    lastActiveAt: profile.lastActiveAt,
    gradeLevel: profile.gradeLevel,
    homeGrade: profile.homeGrade,
    placementProfile: profile.placementProfile,
    profileType: profile.profileType,
    featureFlags: profile.featureFlags,
  };
}

function isCloudStudentRosterDocument(value: unknown): value is CloudStudentRosterDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.profiles) &&
    typeof candidate.syncedAt === "string" &&
    candidate.profiles.every((profile) => isCloudStudentProfileDocument(profile))
  );
}

function parseCloudStudentRosterDocument(value: unknown): StudentProfile[] {
  if (!isCloudStudentRosterDocument(value)) {
    return [];
  }

  return value.profiles
    .map((profile) => parseCloudStudentProfileDocument(profile))
    .filter((profile): profile is StudentProfile => profile !== null)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function buildStudentProfileFromProgressFallback(
  value: unknown,
): StudentProfile | null {
  const progressDocument = parseCloudProgressDocument(value);
  if (!progressDocument?.snapshot.student) {
    return null;
  }

  return normalizeStudentProfile({
    studentId: progressDocument.snapshot.student.studentId,
    displayName: progressDocument.snapshot.student.displayName,
    gradeLevel: progressDocument.snapshot.student.gradeLevel,
    homeGrade: progressDocument.snapshot.student.homeGrade,
    placementProfile: progressDocument.snapshot.student.placementProfile,
    profileType: progressDocument.snapshot.student.profileType,
    featureFlags: progressDocument.snapshot.student.featureFlags,
    createdAt: progressDocument.syncedAt,
    lastActiveAt: progressDocument.lastModified,
    isActive: false,
  });
}

export class FirestoreProgressSyncClient implements ProgressSyncClient {
  constructor(private readonly firestore: Firestore | null = db) {}

  isReady(): boolean {
    return this.firestore !== null;
  }

  async saveProgressToCloud(studentId: string, progressData: ProgressSnapshot): Promise<void> {
    if (!this.firestore) {
      throw new Error("Firebase sync is not configured.");
    }

    const documentRef = doc(this.firestore, "students", studentId, "progress", "current");
    const snapshot = sanitizeProgressSnapshotForCloud(progressData);
    await setDoc(
      documentRef,
      {
        appVersion: snapshot.appVersion,
        debugCliWrite: deleteField(),
        lastModified: getProgressSnapshotLastModified(snapshot),
        syncedAt: new Date().toISOString(),
        snapshot,
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async loadProgressFromCloud(studentId: string): Promise<CloudProgressDocument | null> {
    if (!this.firestore) {
      throw new Error("Firebase sync is not configured.");
    }

    const documentRef = doc(this.firestore, "students", studentId, "progress", "current");
    const snapshot = await getDoc(documentRef);

    if (snapshot.exists()) {
      return parseCloudProgressDocument(snapshot.data());
    }

    if (studentId !== "student-1") {
      return null;
    }

    const legacyDocumentRef = doc(this.firestore, "progress", LEGACY_PROGRESS_SYNC_USER_ID);
    const legacySnapshot = await getDoc(legacyDocumentRef);
    if (!legacySnapshot.exists()) {
      return null;
    }

    return parseCloudProgressDocument(legacySnapshot.data());
  }
}

export class FirestoreStudentProfileSyncClient implements StudentProfileSyncClient {
  constructor(private readonly firestore: Firestore | null = db) {}

  isReady(): boolean {
    return this.firestore !== null;
  }

  async listProfilesFromCloud(): Promise<StudentProfile[]> {
    if (!this.firestore) {
      throw new Error("Firebase sync is not configured.");
    }

    try {
      const rosterProfiles = await this.loadProfilesFromRoster();
      if (rosterProfiles.length > 0) {
        return rosterProfiles;
      }
    } catch {
      // Fall through to legacy discovery so source devices can still republish local profiles.
    }

    return this.loadProfilesFromLegacyDiscovery();
  }

  async saveProfileToCloud(profile: StudentProfile): Promise<void> {
    if (!this.firestore) {
      throw new Error("Firebase sync is not configured.");
    }

    await this.saveProfileToRoster(profile);
    await setDoc(
      doc(this.firestore, "students", profile.studentId, "profile", "current"),
      {
        ...sanitizeProgressSnapshotForCloud(buildCloudStudentProfileDocument(profile)),
        syncedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async deleteProfileFromCloud(studentId: string): Promise<void> {
    if (!this.firestore) {
      throw new Error("Firebase sync is not configured.");
    }

    await this.removeProfileFromRoster(studentId);
    await Promise.all([
      deleteDoc(doc(this.firestore, "students", studentId, "profile", "current")),
      deleteDoc(doc(this.firestore, "students", studentId, "progress", "current")),
    ]);
  }

  private async loadProfilesFromRoster(): Promise<StudentProfile[]> {
    if (!this.firestore) {
      return [];
    }

    const rosterSnapshot = await getDoc(doc(this.firestore, ...STUDENT_ROSTER_SYNC_PATH));
    if (!rosterSnapshot.exists()) {
      return [];
    }

    return parseCloudStudentRosterDocument(rosterSnapshot.data());
  }

  private async loadProfilesFromLegacyDiscovery(): Promise<StudentProfile[]> {
    if (!this.firestore) {
      return [];
    }

    try {
      const profilesById = new Map<string, StudentProfile>();
      const [profileSnapshot, progressSnapshot] = await Promise.all([
        getDocs(collectionGroup(this.firestore, "profile")),
        getDocs(collectionGroup(this.firestore, "progress")),
      ]);

      for (const documentSnapshot of profileSnapshot.docs) {
        const profile = parseCloudStudentProfileDocument(documentSnapshot.data());
        if (!profile) {
          continue;
        }

        profilesById.set(profile.studentId, profile);
      }

      for (const documentSnapshot of progressSnapshot.docs) {
        const profile = buildStudentProfileFromProgressFallback(documentSnapshot.data());
        if (!profile) {
          continue;
        }

        const existingProfile = profilesById.get(profile.studentId);
        if (
          !existingProfile ||
          Date.parse(profile.lastActiveAt) > Date.parse(existingProfile.lastActiveAt)
        ) {
          profilesById.set(profile.studentId, profile);
        }
      }

      return [...profilesById.values()].sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      );
    } catch {
      return [];
    }
  }

  private async saveProfileToRoster(profile: StudentProfile): Promise<void> {
    if (!this.firestore) {
      return;
    }

    const existingProfiles = await this.loadProfilesFromRoster();
    const profilesById = new Map(
      existingProfiles.map((existingProfile) => [
        existingProfile.studentId,
        buildCloudStudentProfileDocument(existingProfile),
      ]),
    );
    profilesById.set(profile.studentId, buildCloudStudentProfileDocument(profile));

    await setDoc(
      doc(this.firestore, ...STUDENT_ROSTER_SYNC_PATH),
      sanitizeProgressSnapshotForCloud({
        profiles: [...profilesById.values()].sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        ),
        syncedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      }),
    );
  }

  private async removeProfileFromRoster(studentId: string): Promise<void> {
    if (!this.firestore) {
      return;
    }

    const existingProfiles = await this.loadProfilesFromRoster();

    await setDoc(
      doc(this.firestore, ...STUDENT_ROSTER_SYNC_PATH),
      sanitizeProgressSnapshotForCloud({
        profiles: existingProfiles
          .filter((profile) => profile.studentId !== studentId)
          .map((profile) => buildCloudStudentProfileDocument(profile)),
        syncedAt: new Date().toISOString(),
        serverUpdatedAt: serverTimestamp(),
      }),
    );
  }
}

export class ProgressSyncManager {
  private readonly listeners = new Set<ProgressSyncListener>();
  private queuedSync: Promise<void> = Promise.resolve();
  private status: ProgressSyncStatus = "offline";

  constructor(
    private readonly client: ProgressSyncClient,
    private readonly dataTransferService: DataTransferServiceContract,
    private readonly getActiveStudentId: () => Promise<string>,
  ) {}

  getStatus(): ProgressSyncStatus {
    return this.status;
  }

  subscribe(listener: ProgressSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async initialize(): Promise<void> {
    if (!this.client.isReady()) {
      this.setStatus("offline");
      return;
    }

    await this.runSync();
  }

  syncInBackground(): void {
    if (!this.client.isReady()) {
      this.setStatus("offline");
      return;
    }

    this.queuedSync = this.queuedSync
      .catch(() => undefined)
      .then(async () => {
        await this.runSync();
      });
  }

  waitForIdle(): Promise<void> {
    return this.queuedSync.catch(() => undefined);
  }

  private async runSync(): Promise<void> {
    this.setStatus("syncing");

    try {
      const studentId = await this.getActiveStudentId();
      const localSnapshot = await this.dataTransferService.exportProgress();
      const localLastModified = getProgressSnapshotLastModified(localSnapshot);
      const cloudDocument = await this.client.loadProgressFromCloud(studentId);

      if (cloudDocument) {
        const cloudLastModified = cloudDocument.lastModified;
        if (Date.parse(cloudLastModified) > Date.parse(localLastModified)) {
          await this.dataTransferService.importProgress(cloudDocument.snapshot);
          this.setStatus("synced");
          return;
        }
      }

      if (hasSnapshotData(localSnapshot) || cloudDocument !== null) {
        await this.client.saveProgressToCloud(studentId, localSnapshot);
      }

      this.setStatus("synced");
    } catch {
      this.setStatus("offline");
    }
  }

  private setStatus(status: ProgressSyncStatus): void {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }
}

export class SyncingSessionService implements SessionService {
  constructor(
    private readonly delegate: SessionService,
    private readonly syncManager: ProgressSyncManager,
  ) {}

  getSession(sessionId: string) {
    return this.delegate.getSession(sessionId);
  }

  getLatestInProgressSession() {
    return this.delegate.getLatestInProgressSession();
  }

  async saveAnswer(
    sessionId: string,
    answer: Parameters<SessionService["saveAnswer"]>[1],
  ): Promise<void> {
    await this.delegate.saveAnswer(sessionId, answer);
    this.syncManager.syncInBackground();
  }

  async setCurrentQuestionIndex(sessionId: string, index: number): Promise<void> {
    await this.delegate.setCurrentQuestionIndex(sessionId, index);
    this.syncManager.syncInBackground();
  }

  submitSession(sessionId: string) {
    return this.delegate.submitSession(sessionId);
  }
}

export class SyncingProgressService implements ProgressService {
  constructor(
    private readonly delegate: ProgressService,
    private readonly syncManager: ProgressSyncManager,
  ) {}

  getProgress() {
    return this.delegate.getProgress();
  }

  getConceptProgress(conceptId: string) {
    return this.delegate.getConceptProgress(conceptId);
  }

  getConceptAttempts(conceptId: string) {
    return this.delegate.getConceptAttempts(conceptId);
  }

  getAttempt(attemptId: string) {
    return this.delegate.getAttempt(attemptId);
  }

  async updateFromAttempt(attempt: Parameters<ProgressService["updateFromAttempt"]>[0]): Promise<void> {
    await this.delegate.updateFromAttempt(attempt);
    this.syncManager.syncInBackground();
  }
}

export class SyncingDataTransferService implements DataTransferServiceContract {
  constructor(
    private readonly delegate: DataTransferServiceContract,
    private readonly syncManager: ProgressSyncManager,
  ) {}

  exportProgress() {
    return this.delegate.exportProgress();
  }

  async importProgress(value: unknown) {
    const snapshot = await this.delegate.importProgress(value);
    this.syncManager.syncInBackground();
    return snapshot;
  }
}

export class SyncingStudentProfileService implements StudentProfileService {
  private mergedCloudProfiles = false;
  private queuedSync: Promise<void> = Promise.resolve();

  constructor(
    private readonly delegate: StudentProfileService & {
      upsertProfileFromCloud(profile: StudentProfile): Promise<StudentProfile>;
    },
    private readonly syncClient: StudentProfileSyncClient,
  ) {}

  async listProfiles(): Promise<StudentProfile[]> {
    await this.ensureCloudProfilesMerged();
    return this.delegate.listProfiles();
  }

  async getActiveProfile(): Promise<StudentProfile> {
    await this.ensureCloudProfilesMerged();
    return this.delegate.getActiveProfile();
  }

  async getActiveStudentId(): Promise<string> {
    return (await this.getActiveProfile()).studentId;
  }

  async setActiveStudent(studentId: string): Promise<StudentProfile> {
    await this.ensureCloudProfilesMerged();
    const profile = await this.delegate.setActiveStudent(studentId);
    this.queueProfileSync(profile);
    return profile;
  }

  async createProfile(
    displayName: string,
    homeGrade?: string,
    placementProfile?: StudentProfile["placementProfile"],
    options?: {
      profileType?: StudentProfile["profileType"];
      featureFlags?: StudentProfile["featureFlags"];
    },
  ): Promise<StudentProfile> {
    await this.ensureCloudProfilesMerged();
    const profile = await this.delegate.createProfile(
      displayName,
      homeGrade,
      placementProfile,
      options,
    );
    this.queueProfileSync(profile);
    return profile;
  }

  async isFeatureEnabled(studentId: string, featureName: string): Promise<boolean> {
    await this.ensureCloudProfilesMerged();
    return this.delegate.isFeatureEnabled(studentId, featureName);
  }

  async convertProfileToTest(studentId: string): Promise<StudentProfile> {
    await this.ensureCloudProfilesMerged();
    const profile = await this.delegate.convertProfileToTest(studentId);
    this.queueProfileSync(profile);
    return profile;
  }

  async setTestProfileFeatureFlag(
    studentId: string,
    featureName: string,
    enabled: boolean,
  ): Promise<StudentProfile> {
    await this.ensureCloudProfilesMerged();
    const profile = await this.delegate.setTestProfileFeatureFlag(studentId, featureName, enabled);
    this.queueProfileSync(profile);
    return profile;
  }

  async deleteTestProfile(studentId: string): Promise<void> {
    await this.ensureCloudProfilesMerged();
    await this.delegate.deleteTestProfile(studentId);
    this.queueDeleteProfile(studentId);
  }

  waitForIdle(): Promise<void> {
    return this.queuedSync.catch(() => undefined);
  }

  private async ensureCloudProfilesMerged(): Promise<void> {
    if (this.mergedCloudProfiles || !this.syncClient.isReady()) {
      this.mergedCloudProfiles = true;
      return;
    }

    try {
      const localProfiles = await this.delegate.listProfiles();
      const cloudProfiles = await this.syncClient.listProfilesFromCloud();
      const localProfilesById = new Map(localProfiles.map((profile) => [profile.studentId, profile]));

      await this.mergeCloudProfilesIntoLocal(localProfilesById, cloudProfiles);
      await this.syncProfilesNow(await this.delegate.listProfiles());
    } catch {
      // Keep local-first behavior if Firebase is unavailable.
    } finally {
      this.mergedCloudProfiles = true;
    }
  }

  private async mergeCloudProfilesIntoLocal(
    localProfilesById: Map<string, StudentProfile>,
    cloudProfiles: StudentProfile[],
  ): Promise<void> {
    for (const cloudProfile of cloudProfiles) {
      const localProfile = localProfilesById.get(cloudProfile.studentId);
      if (!localProfile) {
        const importedProfile = await this.delegate.upsertProfileFromCloud({
          ...cloudProfile,
          isActive: false,
        });
        localProfilesById.set(importedProfile.studentId, importedProfile);
        continue;
      }

      const localTimestamp = Date.parse(localProfile.lastActiveAt);
      const cloudTimestamp = Date.parse(cloudProfile.lastActiveAt);
      const shouldPreferCloud =
        cloudTimestamp > localTimestamp ||
        (cloudTimestamp === localTimestamp &&
          JSON.stringify(buildCloudStudentProfileDocument(cloudProfile)).length >
            JSON.stringify(buildCloudStudentProfileDocument(localProfile)).length);

      if (!shouldPreferCloud) {
        continue;
      }

      const mergedProfile = await this.delegate.upsertProfileFromCloud({
        ...cloudProfile,
        isActive: localProfile.isActive,
      });
      localProfilesById.set(mergedProfile.studentId, mergedProfile);
    }
  }

  private async syncProfilesNow(profiles: StudentProfile[]): Promise<void> {
    if (!this.syncClient.isReady()) {
      return;
    }

    for (const profile of profiles) {
      await this.syncClient.saveProfileToCloud(profile);
    }
  }

  private queueProfileSync(profile: StudentProfile): void {
    if (!this.syncClient.isReady()) {
      return;
    }

    this.queuedSync = this.queuedSync
      .catch(() => undefined)
      .then(async () => {
        await this.syncClient.saveProfileToCloud(profile);
      })
      .catch(() => undefined);
  }

  private queueDeleteProfile(studentId: string): void {
    if (!this.syncClient.isReady()) {
      return;
    }

    this.queuedSync = this.queuedSync
      .catch(() => undefined)
      .then(async () => {
        await this.syncClient.deleteProfileFromCloud(studentId);
      })
      .catch(() => undefined);
  }
}
