export interface IUser {
  id: string;
  sub?: string;
  name?: string;
  email?: string;
  role?: string;
  newAccessToken?: string;
  newRefreshToken?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  extraUserData: {
    apps: string[];
  };
  iat: number;
}

export interface KeyCloakSuccessfulLoginResponse {
  access_token: {
    token: string;
    content: {
      name: string;
      email: string;
    };
  };
}
export interface KeycloakConfig {
  realm: string;
  authServerUrl: string;
  sslRequired: string;
  resource: string;
  publicClient: true;
  confidentialPort: number;
  secret: string;
  usersGroup?: string;
}

export interface KeycloakCredentials {
  username: string;
  password: string;
}
