import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgressSnapshot } from "../services/dataTransferService";

const {
  collectionGroupMock,
  deleteFieldMock,
  deleteDocMock,
  docMock,
  getDocMock,
  getDocsMock,
  serverTimestampMock,
  setDocMock,
} = vi.hoisted(() => ({
  collectionGroupMock: vi.fn((_: unknown, collectionId: string) => ({ collectionId })),
  deleteFieldMock: vi.fn(() => "__DELETE_FIELD__"),
  deleteDocMock: vi.fn(),
  docMock: vi.fn((_: unknown, ...segments: string[]) => ({ path: segments.join("/") })),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  serverTimestampMock: vi.fn(() => "__SERVER_TIMESTAMP__"),
  setDocMock: vi.fn(),
}));

vi.mock("../services/firebase", () => ({
  db: null,
}));

vi.mock("firebase/firestore", () => ({
  collectionGroup: (firestore: unknown, collectionId: string) =>
    collectionGroupMock(firestore, collectionId),
  deleteField: () => deleteFieldMock(),
  deleteDoc: (reference: unknown) => deleteDocMock(reference),
  doc: docMock,
  getDoc: getDocMock,
  getDocs: (query: unknown) => getDocsMock(query),
  serverTimestamp: () => serverTimestampMock(),
  setDoc: setDocMock,
}));

import {
  FirestoreProgressSyncClient,
  FirestoreStudentProfileSyncClient,
} from "../services/firebaseProgressSync";

function buildSnapshot(): ProgressSnapshot {
  return {
    appVersion: "1.0.1",
    exportedAt: "2026-04-19T18:00:00.000Z",
    student: {
      studentId: "student-1",
      displayName: "Student 1",
      homeGrade: "6",
      gradeLevel: undefined,
      placementProfile: {
        overall: {
          instructionalGrade: "7",
          programPathway: "accelerated",
        },
        subjects: {
          math: {
            instructionalGrade: "7",
            programPathway: "accelerated",
          },
        },
      },
    },
    data: {
      sessions: [
        {
          id: "session-1",
          studentId: "student-1",
          mode: "concept",
          courseId: "course-2",
          conceptId: "concept-ratios",
          testSetId: undefined,
          conceptIds: ["concept-ratios"],
          questionIds: ["question-1"],
          answers: {
            "question-1": {
              questionId: "question-1",
              response: "42",
              answeredAt: "2026-04-19T18:01:00.000Z",
            },
          },
          currentQuestionIndex: 0,
          status: "in_progress",
          createdAt: "2026-04-19T18:00:00.000Z",
          updatedAt: "2026-04-19T18:01:00.000Z",
        },
      ],
      attempts: [],
      progress: [],
    },
  };
}

describe("FirestoreProgressSyncClient", () => {
  beforeEach(() => {
    collectionGroupMock.mockClear();
    deleteFieldMock.mockClear();
    deleteDocMock.mockClear();
    docMock.mockClear();
    getDocMock.mockReset();
    getDocsMock.mockReset();
    serverTimestampMock.mockClear();
    setDocMock.mockReset();
  });

  it("ignores invalid cloud documents instead of treating them as fatal", async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        serverUpdatedAt: "2026-04-19T18:00:00.000Z",
      }),
    });

    const client = new FirestoreProgressSyncClient({} as never);

    await expect(client.loadProgressFromCloud("student-1")).resolves.toBeNull();
  });

  it("removes stale debug payloads while writing real progress snapshots", async () => {
    const client = new FirestoreProgressSyncClient({} as never);
    const snapshot = buildSnapshot();

    await client.saveProgressToCloud("student-1", snapshot);

    expect(setDocMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).toHaveBeenCalledWith(
      { path: "students/student-1/progress/current" },
      expect.objectContaining({
        appVersion: snapshot.appVersion,
        debugCliWrite: "__DELETE_FIELD__",
        snapshot: expect.objectContaining({
          appVersion: snapshot.appVersion,
          student: {
            studentId: "student-1",
            displayName: "Student 1",
            homeGrade: "6",
            placementProfile: {
              overall: {
                instructionalGrade: "7",
                programPathway: "accelerated",
              },
              subjects: {
                math: {
                  instructionalGrade: "7",
                  programPathway: "accelerated",
                },
              },
            },
          },
        }),
        serverUpdatedAt: "__SERVER_TIMESTAMP__",
      }),
      { merge: true },
    );

    const writtenSnapshot = setDocMock.mock.calls[0]?.[1]?.snapshot as ProgressSnapshot;
    expect(writtenSnapshot.student).not.toHaveProperty("gradeLevel");
    expect(writtenSnapshot.data.sessions[0]).not.toHaveProperty("testSetId");
  });

  it("lists synced student profiles from dedicated profile documents", async () => {
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              studentId: "student-2",
              displayName: "Daughter",
              createdAt: "2026-04-19T18:00:00.000Z",
              lastActiveAt: "2026-04-19T18:30:00.000Z",
              homeGrade: "6",
              profileType: "production",
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [],
      });

    const client = new FirestoreStudentProfileSyncClient({} as never);
    await expect(client.listProfilesFromCloud()).resolves.toEqual([
      expect.objectContaining({
        studentId: "student-2",
        displayName: "Daughter",
        homeGrade: "6",
        isActive: false,
      }),
    ]);
  });

  it("falls back to progress snapshot student summaries when no profile docs exist yet", async () => {
    getDocsMock
      .mockResolvedValueOnce({
        docs: [],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              appVersion: "1.0.1",
              lastModified: "2026-04-19T19:00:00.000Z",
              syncedAt: "2026-04-19T19:01:00.000Z",
              snapshot: {
                ...buildSnapshot(),
                student: {
                  studentId: "student-2",
                  displayName: "Daughter",
                  homeGrade: "6",
                  profileType: "production",
                },
              },
            }),
          },
        ],
      });

    const client = new FirestoreStudentProfileSyncClient({} as never);
    await expect(client.listProfilesFromCloud()).resolves.toEqual([
      expect.objectContaining({
        studentId: "student-2",
        displayName: "Daughter",
        homeGrade: "6",
        lastActiveAt: "2026-04-19T19:00:00.000Z",
      }),
    ]);
  });

  it("writes and deletes synced student profile documents", async () => {
    const client = new FirestoreStudentProfileSyncClient({} as never);

    await client.saveProfileToCloud({
      studentId: "student-2",
      displayName: "Daughter",
      homeGrade: "6",
      createdAt: "2026-04-19T18:00:00.000Z",
      lastActiveAt: "2026-04-19T18:30:00.000Z",
      isActive: false,
      profileType: "production",
    });

    expect(setDocMock).toHaveBeenCalledWith(
      { path: "students/student-2/profile/current" },
      expect.objectContaining({
        studentId: "student-2",
        displayName: "Daughter",
        homeGrade: "6",
        serverUpdatedAt: "__SERVER_TIMESTAMP__",
      }),
      { merge: true },
    );

    await client.deleteProfileFromCloud("student-2");

    expect(deleteDocMock).toHaveBeenCalledTimes(2);
    expect(deleteDocMock).toHaveBeenCalledWith({ path: "students/student-2/profile/current" });
    expect(deleteDocMock).toHaveBeenCalledWith({ path: "students/student-2/progress/current" });
  });
});
