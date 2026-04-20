// Auth types — aligned with backend-v2 + frontend-v3
// Account → Profile model (1 account, multiple profiles)

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Profile {
  id: string;
  nickname: string;
  target_level: string | null;
  target_deadline: string | null;
  entry_level: string | null;
  avatar_color: string | null;
  is_initial_profile: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
  profile: Profile | null;
}

export interface RegisterResponse {
  user: User;
  profile: Profile;
  message: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  profile: Profile | null;
}
