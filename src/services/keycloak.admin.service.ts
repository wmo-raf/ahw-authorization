import { IUser } from "services/keycloak.interfaces";
import config from "config";
import KcAdminClient, { requiredAction } from "@keycloak/keycloak-admin-client";
import { KeycloakConfig, KeycloakCredentials } from "./keycloak.interfaces";
import { Credentials } from "@keycloak/keycloak-admin-client/lib/utils/auth";
import { Users } from "@keycloak/keycloak-admin-client/lib/resources/users";
import UserNotFoundError from "errors/userNotFound.error";

const keycloakConfig: KeycloakConfig = config.get("keycloak");
const keycloakCredentials: KeycloakCredentials = config.get(
  "keycloakCredentials"
);

const kcAdminClient = new KcAdminClient({
  baseUrl: keycloakConfig.authServerUrl,
  realmName: keycloakConfig.realm,
});

const kcCredentials: Credentials = {
  username: keycloakCredentials.username,
  password: keycloakCredentials.password,
  grantType: "password",
  clientId: keycloakConfig.resource,
  clientSecret: keycloakConfig.secret,
};

export default class KeycloakAdminService {
  static async createUserWithoutPassword(payload: any): Promise<any> {
    // authorize client
    await kcAdminClient.auth(kcCredentials);
    // create user
    return kcAdminClient.users.create({
      username: payload.email,
      email: payload.email,
      enabled: true,
      emailVerified: false,
      requiredActions: [requiredAction.UPDATE_PASSWORD],
      groups: [keycloakConfig.usersGroup],
    });
  }
  static async sendVerificationEmail(config: {
    userId: string;
    clientId?: string;
    redirectUri?: string;
  }): Promise<any> {
    // authorize client
    await kcAdminClient.auth(kcCredentials);

    // send verification email
    return kcAdminClient.users.sendVerifyEmail({
      id: config.userId,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
    });
  }

  static async requestPasswordReset(email: string): Promise<any> {
    // authorize client
    await kcAdminClient.auth(kcCredentials);

    const users = await kcAdminClient.users.find({ email: email });

    if (!!users.length) {
      const user = users[0];
      // trigger execution email
      return await kcAdminClient.users.executeActionsEmail({
        id: user.id,
        lifespan: 7200,
        actions: [requiredAction.UPDATE_PASSWORD],
      });
    } else {
      throw new UserNotFoundError();
    }
  }

  static async getUserById(userId: string): Promise<any> {
    await kcAdminClient.auth(kcCredentials);

    return await kcAdminClient.users.findOne({ id: userId });
  }
}
