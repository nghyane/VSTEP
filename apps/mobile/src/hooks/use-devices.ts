import { useMutation } from "@tanstack/react-query";

type Platform = "ios" | "android" | "web";

export function useRegisterDevice() {
  return useMutation({ mutationFn: async (_body: { token: string; platform: Platform }) => ({ id: "mock-device", token: _body.token, platform: _body.platform, createdAt: new Date().toISOString() }) });
}

export function useRemoveDevice() {
  return useMutation({ mutationFn: async (id: string) => ({ id }) });
}
