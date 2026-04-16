import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface TestModeContextValue {
  isTestMode: boolean;
  setIsTestMode: (value: boolean) => void;
}

const TestModeContext = createContext<TestModeContextValue | null>(null);

export function TestModeProvider({ children }: PropsWithChildren) {
  const [isTestMode, setIsTestMode] = useState(false);
  const value = useMemo(() => ({ isTestMode, setIsTestMode }), [isTestMode]);

  return <TestModeContext.Provider value={value}>{children}</TestModeContext.Provider>;
}

export function useTestMode(): TestModeContextValue {
  const value = useContext(TestModeContext);
  if (!value) {
    throw new Error("TestModeProvider is missing.");
  }

  return value;
}
