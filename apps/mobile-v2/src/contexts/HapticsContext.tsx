import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as Haptics from "expo-haptics";

interface HapticsCtx {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  trigger: () => void;
}

const HapticsContext = createContext<HapticsCtx>({
  enabled: true,
  setEnabled: () => undefined,
  trigger: () => undefined,
});

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  const trigger = useCallback(() => {
    if (enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }, [enabled]);

  return (
    <HapticsContext.Provider value={{ enabled, setEnabled, trigger }}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  return useContext(HapticsContext);
}
