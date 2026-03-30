import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRegisterDevice } from "./use-devices";
import { useAuth } from "./use-auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications when the user is authenticated.
 * Call once in the app (e.g., home screen).
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const registerDevice = useRegisterDevice();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;

    (async () => {
      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const platform = Platform.OS === "ios" ? "ios" : "android";

      registerDevice.mutate(
        { token: tokenData.data, platform },
        { onSuccess: () => { registered.current = true; } },
      );
    })();
  }, [user]);
}
