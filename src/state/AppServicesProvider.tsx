import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { BasicScoringEngine } from "../engines/basicScoringEngine";
import { DeterministicConceptTestEngine } from "../engines/deterministicConceptTestEngine";
import { MixedTestEligibilityEngine } from "../engines/mixedTestEligibilityEngine";
import { StableSelectionStrategy } from "../engines/questionSelectionStrategy";
import { createDefaultContentRepository } from "../services/contentRepository";
import { DataTransferService } from "../services/dataTransferService";
import { LocalProgressService } from "../services/progressService";
import { LocalSessionService } from "../services/sessionService";
import { IndexedDBStorageService } from "../storage/indexedDbStorageService";
import { MemoryStorageService } from "../storage/memoryStorageService";
import {
  AttemptRepository,
  ProgressRepository,
  SessionRepository,
} from "../storage/repositories";
import type { StorageService } from "../storage/storageService";
import type {
  ContentRepository,
  DataTransferServiceContract,
  MixedTestService,
  ProgressService,
  SessionService,
  TestGenerationService,
} from "../services/contracts";

export interface AppServices {
  contentRepository: ContentRepository;
  testGenerationService: TestGenerationService;
  sessionService: SessionService;
  progressService: ProgressService;
  mixedTestService: MixedTestService;
  dataTransferService: DataTransferServiceContract;
}

const AppServicesContext = createContext<AppServices | null>(null);

export async function createAppServices(
  store: StorageService = new MemoryStorageService(),
): Promise<AppServices> {
  const contentRepository = await createDefaultContentRepository();
  const sessionRepository = new SessionRepository(store);
  const attemptRepository = new AttemptRepository(store);
  const progressRepository = new ProgressRepository(store);
  const progressService = new LocalProgressService(attemptRepository, progressRepository);
  const scoringService = new BasicScoringEngine(contentRepository);
  const sessionService = new LocalSessionService(
    sessionRepository,
    attemptRepository,
    scoringService,
    progressService,
  );
  const selectionStrategy = new StableSelectionStrategy();
  const testGenerationService = new DeterministicConceptTestEngine(
    contentRepository,
    sessionRepository,
    selectionStrategy,
  );
  const mixedTestService = new MixedTestEligibilityEngine(progressService);
  const dataTransferService = new DataTransferService(store);

  return {
    contentRepository,
    testGenerationService,
    sessionService,
    progressService,
    mixedTestService,
    dataTransferService,
  };
}

async function createDefaultAppServices(): Promise<AppServices> {
  const store = await IndexedDBStorageService.create();
  return createAppServices(store);
}

export function AppServicesProvider({
  children,
  services: providedServices,
}: PropsWithChildren<{ services?: AppServices }>) {
  const [services, setServices] = useState<AppServices | null>(providedServices ?? null);

  useEffect(() => {
    if (providedServices) {
      setServices(providedServices);
      return;
    }

    let isMounted = true;
    void createDefaultAppServices().then((initializedServices) => {
      if (isMounted) {
        setServices(initializedServices);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [providedServices]);

  const resolvedServices = useMemo(() => services, [services]);

  if (!resolvedServices) {
    return <div className="app-shell"><div className="panel panel-padding">Loading app data...</div></div>;
  }

  return (
    <AppServicesContext.Provider value={resolvedServices}>
      {children}
    </AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const value = useContext(AppServicesContext);
  if (!value) {
    throw new Error("AppServicesProvider is missing.");
  }

  return value;
}
