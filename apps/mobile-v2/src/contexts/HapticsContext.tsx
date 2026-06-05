import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface HapticsCtx {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  trigger: () => void;
}

const HapticsContext = createContext<HapticsCtx>({
  enabled: false,
  setEnabled: () => undefined,
  trigger: () => undefined,
});

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const trigger = useCallback(() => {
    return undefined;
  }, []);

  return (
    <HapticsContext.Provider value={{ enabled, setEnabled, trigger }}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  return useContext(HapticsContext);
}
