import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";

const HAPTICS_KEY = "vstep_haptics_enabled";

interface HapticsContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  trigger: () => void;
}

const HapticsContext = createContext<HapticsContextValue>({
  enabled: true,
  setEnabled: () => {},
  trigger: () => {},
});

export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(HAPTICS_KEY).then((v) => {
      if (v === "false") setEnabledState(false);
    });
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    SecureStore.setItemAsync(HAPTICS_KEY, v ? "true" : "false");
  }, []);

  const trigger = useCallback(
    () => {
      if (enabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      }
    },
    [enabled],
  );

  return (
    <HapticsContext.Provider value={{ enabled, setEnabled, trigger }}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  return useContext(HapticsContext);
}
