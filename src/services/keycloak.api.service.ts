import axios from "axios";
import qs from "qs";
import config from "config";

import { KeycloakConfig } from "./keycloak.interfaces";

const keycloakConfig: KeycloakConfig = config.get("keycloak");

export default class KeyCloakApiService {
  static async logout(accessToken: string, refreshToken: string): Promise<any> {
    const logoutUrl = `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;

    const data = {
      client_id: keycloakConfig.resource,
      client_secret: keycloakConfig.secret,
      refresh_token: refreshToken,
    };

    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Bearer ${accessToken}`,
    };

    return await axios.post(logoutUrl, qs.stringify(data), {
      headers: headers,
    });
  }
}
