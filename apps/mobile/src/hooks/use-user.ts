// User hooks — profile data via API
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export function useUser(_id: string) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<ApiResponse<{ user: any; profile: any }>>("auth/me"),
  });
}

export function useUploadAvatar(_id: string) {
  return useMutation({
    mutationFn: async (_uri: string) => {
      // TODO: implement avatar upload via presigned URL
    },
  });
}
