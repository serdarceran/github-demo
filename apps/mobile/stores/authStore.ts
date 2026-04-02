import { create } from "zustand";
import { saveToken, getToken, deleteToken } from "../lib/secureStorage";
import { ApiClient, createAuthApi } from "@goal-tracker/api-client";

interface AuthState {
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const token = await getToken();
    set({ token, isHydrated: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // Unauthenticated client just for the login call
      const client = new ApiClient(
        process.env.EXPO_PUBLIC_API_BASE_URL!,
        () => null,
      );
      const { token } = await createAuthApi(client).getToken({ email, password });
      await saveToken(token);
      set({ token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await deleteToken();
    set({ token: null });
  },
}));

/**
 * Returns an authenticated ApiClient bound to the current token.
 * Import and call this hook inside components/hooks.
 */
export function useApiClient(): ApiClient {
  const token = useAuthStore((s) => s.token);
  return new ApiClient(process.env.EXPO_PUBLIC_API_BASE_URL!, () => token);
}
