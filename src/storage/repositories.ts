import type { ProgressRecord, TestAttempt, TestSession } from "../domain/models";
import type { StorageService } from "./storageService";

export const STORE_NAMES = {
  sessions: "sessions",
  attempts: "attempts",
  progress: "progress",
} as const;

export class SessionRepository {
  constructor(private readonly store: StorageService) {}

  async list(): Promise<Record<string, TestSession>> {
    const sessions = await this.store.getAll<TestSession>(STORE_NAMES.sessions);
    return Object.fromEntries(sessions.map((session) => [session.id, session]));
  }

  async get(sessionId: string): Promise<TestSession | null> {
    return this.store.get<TestSession>(STORE_NAMES.sessions, sessionId);
  }

  async save(session: TestSession): Promise<void> {
    await this.store.set(STORE_NAMES.sessions, session.id, session);
  }
}

export class AttemptRepository {
  constructor(private readonly store: StorageService) {}

  async list(): Promise<TestAttempt[]> {
    return this.store.getAll<TestAttempt>(STORE_NAMES.attempts);
  }

  async append(attempt: TestAttempt): Promise<void> {
    await this.store.set(STORE_NAMES.attempts, attempt.attemptId, attempt);
  }

  async get(attemptId: string): Promise<TestAttempt | null> {
    return this.store.get<TestAttempt>(STORE_NAMES.attempts, attemptId);
  }

  async listByConcept(conceptId: string): Promise<TestAttempt[]> {
    const attempts = await this.list();
    return attempts
      .filter((attempt) => attempt.conceptId === conceptId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  }
}

export class ProgressRepository {
  constructor(private readonly store: StorageService) {}

  async list(): Promise<Record<string, ProgressRecord>> {
    const records = await this.store.getAll<ProgressRecord>(STORE_NAMES.progress);
    return Object.fromEntries(records.map((progress) => [progress.conceptId, progress]));
  }

  async get(conceptId: string): Promise<ProgressRecord | null> {
    return this.store.get<ProgressRecord>(STORE_NAMES.progress, conceptId);
  }

  async save(progress: ProgressRecord): Promise<void> {
    await this.store.set(STORE_NAMES.progress, progress.conceptId, progress);
  }
}
