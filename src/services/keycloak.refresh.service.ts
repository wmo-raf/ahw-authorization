import config from "config";
import { Issuer } from "openid-client";

import { KeycloakConfig } from "./keycloak.interfaces";

const keycloakConfig: KeycloakConfig = config.get("keycloak");

export default class KeyCloakRefreshService {
  static async resfreshToken(refreshToken: string): Promise<any> {
    const keycloakIssuer = await Issuer.discover(
      `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.resource}`
    );

    const client = new keycloakIssuer.Client({
      client_id: keycloakConfig.resource,
      client_secret: keycloakConfig.secret,
    });

    return client.refresh(refreshToken);
  }
}
