import type { PlacementLevel, PlacementProfile, StudentProfile } from "../domain/models";
import type { StudentProfileService } from "./contracts";
import { createId } from "../utils/id";
import { StudentProfileRepository } from "../storage/repositories";

export const DEFAULT_STUDENT_ID = "student-1";

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizePlacementLevel(
  placement: PlacementLevel | null | undefined,
): PlacementLevel | undefined {
  if (!placement) {
    return undefined;
  }

  const instructionalGrade = normalizeOptionalText(placement.instructionalGrade);
  const programPathway = normalizeOptionalText(placement.programPathway);

  if (!instructionalGrade && !programPathway) {
    return undefined;
  }

  return {
    instructionalGrade,
    programPathway,
  };
}

function normalizePlacementProfile(
  placementProfile: PlacementProfile | null | undefined,
): PlacementProfile | undefined {
  if (!placementProfile) {
    return undefined;
  }

  const overall = normalizePlacementLevel(placementProfile.overall);
  const subjects = Object.fromEntries(
    Object.entries(placementProfile.subjects ?? {})
      .map(([subjectId, placement]) => [normalizeOptionalText(subjectId), normalizePlacementLevel(placement)])
      .filter(
        (entry): entry is [string, PlacementLevel] =>
          typeof entry[0] === "string" && typeof entry[1] !== "undefined",
      ),
  );

  if (!overall && Object.keys(subjects).length === 0) {
    return undefined;
  }

  return {
    overall,
    subjects: Object.keys(subjects).length > 0 ? subjects : undefined,
  };
}

export function normalizeStudentProfile(profile: StudentProfile): StudentProfile {
  const homeGrade = normalizeOptionalText(profile.homeGrade ?? profile.gradeLevel);

  return {
    ...profile,
    displayName: normalizeOptionalText(profile.displayName) ?? profile.displayName,
    gradeLevel: normalizeOptionalText(profile.gradeLevel),
    homeGrade,
    placementProfile: normalizePlacementProfile(profile.placementProfile),
  };
}

function buildDefaultStudentProfile(): StudentProfile {
  const now = new Date().toISOString();
  return {
    studentId: DEFAULT_STUDENT_ID,
    displayName: "Student 1",
    createdAt: now,
    lastActiveAt: now,
    isActive: true,
  };
}

export class LocalStudentProfileService implements StudentProfileService {
  private initialized = false;

  constructor(private readonly repository: StudentProfileRepository) {}

  async listProfiles(): Promise<StudentProfile[]> {
    await this.ensureInitialized();
    return this.listSortedProfiles();
  }

  async getActiveProfile(): Promise<StudentProfile> {
    await this.ensureInitialized();
    const profiles = await this.listSortedProfiles();

    return profiles.find((profile) => profile.isActive) ?? profiles[0] ?? buildDefaultStudentProfile();
  }

  async getActiveStudentId(): Promise<string> {
    return (await this.getActiveProfile()).studentId;
  }

  async setActiveStudent(studentId: string): Promise<StudentProfile> {
    await this.ensureInitialized();
    const profiles = await this.listSortedProfiles();
    const target = profiles.find((profile) => profile.studentId === studentId);

    if (!target) {
      throw new Error(`Unknown student profile: ${studentId}`);
    }

    const now = new Date().toISOString();
    for (const profile of profiles) {
      await this.repository.save({
        ...profile,
        isActive: profile.studentId === studentId,
        lastActiveAt: profile.studentId === studentId ? now : profile.lastActiveAt,
      });
    }

    return {
      ...target,
      isActive: true,
      lastActiveAt: now,
    };
  }

  async createProfile(
    displayName: string,
    homeGrade?: string,
    placementProfile?: PlacementProfile,
  ): Promise<StudentProfile> {
    await this.ensureInitialized();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      throw new Error("Student name is required.");
    }

    const now = new Date().toISOString();
    const profile: StudentProfile = {
      studentId: createId("student"),
      displayName: trimmedName,
      homeGrade: normalizeOptionalText(homeGrade),
      placementProfile: normalizePlacementProfile(placementProfile),
      createdAt: now,
      lastActiveAt: now,
      isActive: false,
    };

    const normalizedProfile = normalizeStudentProfile(profile);
    await this.repository.save(normalizedProfile);
    return normalizedProfile;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const profiles = await this.normalizeStoredProfiles();
    if (profiles.length === 0) {
      await this.repository.save(buildDefaultStudentProfile());
      this.initialized = true;
      return;
    }

    if (!profiles.some((profile) => profile.isActive)) {
      const [firstProfile] = [...profiles].sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      );
      if (firstProfile) {
        await this.repository.save({ ...firstProfile, isActive: true });
      }
    }

    this.initialized = true;
  }

  private async listSortedProfiles(): Promise<StudentProfile[]> {
    return [...(await this.normalizeStoredProfiles())].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  private async normalizeStoredProfiles(): Promise<StudentProfile[]> {
    const profiles = await this.repository.list();
    const normalizedProfiles = profiles.map((profile) => normalizeStudentProfile(profile));

    for (let index = 0; index < profiles.length; index += 1) {
      if (JSON.stringify(profiles[index]) !== JSON.stringify(normalizedProfiles[index])) {
        await this.repository.save(normalizedProfiles[index]);
      }
    }

    return normalizedProfiles;
  }
}
