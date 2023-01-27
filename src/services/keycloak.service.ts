import Keycloak from "keycloak-connect";
import config from "config";
import redisStore from "koa-redis";
import { Context } from "koa";
import logger from "logger";

import { JWTPayload } from "services/keycloak.interfaces";
import KeyCloakAdminService from "services/keycloak.admin.service";
import KeyCloakApiService from "./keycloak.api.service";
import { KeycloakConfig } from "./keycloak.interfaces";
import Utils from "utils";

const keycloakConfig: KeycloakConfig = config.get("keycloak");

const emailSendingEnabled: boolean = Utils.toBool(keycloakConfig.emailSendingEnabled);

const kConfig = {
  realm: keycloakConfig.realm,
  "auth-server-url": keycloakConfig.authServerUrl,
  "ssl-required": keycloakConfig.sslRequired,
  resource: keycloakConfig.resource,
  "confidential-port": keycloakConfig.confidentialPort,
  credentials: {
    secret: keycloakConfig.secret,
  },
};

const keycloak = new Keycloak(
  {
    store: redisStore({
      url: config.get("redis.url"),
      db: 1,
    }),
  },
  kConfig
);

export default class KeyCloakService {
  static async login(username: string, password: string): Promise<any> {
    return await keycloak.grantManager.obtainDirectly(username, password);
  }

  static async register(email: string): Promise<any> {
    const user = await KeyCloakAdminService.createUserWithoutPassword({
      email,
    });

    if (emailSendingEnabled) {
      await KeyCloakAdminService.sendVerificationEmail({ userId: user.id });
    }

    return user;
  }

  static async resetPassword(email: string): Promise<any> {
    return await KeyCloakAdminService.requestPasswordReset(email);
  }

  static async getUserById(userId: string): Promise<any> {
    const user = await KeyCloakAdminService.getUserById(userId);

    return user;
  }

  static async checkRevokedToken(
    ctx: Context,
    payload: JWTPayload
  ): Promise<boolean> {
    logger.info("[KeyCloakService] Checking if token is revoked");

    let isRevoked: boolean = false;

    try {
      return isRevoked;
    } catch (err) {
      logger.error(err);
      return true;
    }
  }

  static async logout(accessToken: string, refreshToken: string): Promise<any> {
    return await KeyCloakApiService.logout(accessToken, refreshToken);
  }
}
