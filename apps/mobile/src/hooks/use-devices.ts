import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Platform = "ios" | "android" | "web";

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (body: { token: string; platform: Platform }) =>
      api.post<{ id: string; token: string; platform: Platform; createdAt: string }>(
        "/api/devices",
        body,
      ),
  });
}

export function useRemoveDevice() {
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/devices/${id}`),
  });
}
