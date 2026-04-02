import type { ApiClient } from "./client";

export interface LoginBody {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
}

export function createAuthApi(client: ApiClient) {
  return {
    getToken(body: LoginBody): Promise<TokenResponse> {
      return client.post<TokenResponse>("/api/auth/token", body);
    },
  };
}
