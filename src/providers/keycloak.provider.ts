import { Grant } from "keycloak-connect";
import { Context } from "koa";
import { RouterContext } from "koa-router";
import logger from "logger";
import Utils from "utils";

import KeyCloakService from "services/keycloak.service";
import UnprocessableEntityError from "errors/unprocessableEntity.error";
import { IUser } from "services/keycloak.interfaces";

export class KeycloakProvider {
  static async localCallback(ctx: Context & RouterContext): Promise<void> {
    try {
      const grant: Grant = await KeyCloakService.login(
        ctx.request.body.email,
        ctx.request.body.password
      );

      ctx.status = 200;

      ctx.body = {
        // @ts-ignore
        id: grant.access_token.content.sub,
        // @ts-ignore
        email: grant.access_token.content.email,
        // @ts-ignore
        name: grant.access_token.content.name,
        // @ts-ignore
        token: grant.access_token.token,
        // @ts-ignore
        refreshToken: grant.refresh_token.token,
      };
    } catch (err) {
      if (err.message == "401:Unauthorized") {
        ctx.status = 401;
        ctx.body = {
          errors: [
            {
              status: 401,
              detail: "Invalid email or password",
            },
          ],
        };
        return;
      }

      if (err.response?.data?.errorMessage === "Authentication failed") {
        // Authentication failed
        ctx.status = 401;
        ctx.body = {
          errors: [
            {
              status: 401,
              detail: "Invalid email or password",
            },
          ],
        };
        return;
      }

      // Unknown error, log and report 500 Internal Server Error
      logger.error("[KeyCloakProvider] - Failed login request: ", err);
      ctx.throw(500, "Internal server error");
    }
  }

  static async checkLogged(ctx: Context): Promise<void> {
    if (Utils.getUser(ctx)) {
      const userToken: IUser = Utils.getUser(ctx);

      const user: IUser = await KeyCloakService.getUserById(userToken.sub);

      ctx.body = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      if (userToken.newAccessToken && userToken.newRefreshToken) {
        // @ts-ignore
        ctx.body.access_token = userToken.newAccessToken;
        // @ts-ignore
        ctx.body.refresh_token = userToken.newRefreshToken;
      }
    } else {
      ctx.res.statusCode = 401;
      ctx.throw(401, "Not authenticated");
    }
  }

  static async signUp(ctx: Context): Promise<void> {
    try {
      logger.info("[KeyCloakProvider] - Creating user");

      const newUser = await KeyCloakService.register(ctx.request.body.email);

      ctx.response.type = "application/json";
      ctx.body = newUser;
    } catch (err) {
      let error: string = "Error creating user.";

      if (
        err.response?.data?.errorMessage ===
        "login: The field cannot be left blank"
      ) {
        error = "Email is required";
      }

      if (
        err.response?.data?.errorMessage === "User exists with same username"
      ) {
        error = "Email exists";
      }

      logger.error("[KeyCloakProvider] - Error creating user: ", err);
      logger.error(
        "[KeyCloakProvider] Error causes (if present): ",
        err.response?.data?.errorMessage
      );

      throw new UnprocessableEntityError(error);
    }
  }

  static async logOut(ctx: Context): Promise<void> {
    if (Utils.getUser(ctx)) {
      const token = Utils.getToken(ctx);
      if (ctx.request.body?.refreshToken) {
        const res = await KeyCloakService.logout(
          token,
          ctx.request.body?.refreshToken
        );

        ctx.res.statusCode = 200;
      } else {
        ctx.res.statusCode = 401;
        ctx.throw(400, "No refresh token");
      }
    } else {
      ctx.res.statusCode = 401;
      ctx.throw(401, "Not authenticated");
    }
  }

  static async requestPasswordReset(ctx: Context): Promise<void> {
    logger.info("[KeyCloakProvider] - Requesting password reset");

    if (!ctx.request.body.email) {
      ctx.throw(400, "Email required");
    }

    try {
      await KeyCloakService.resetPassword(ctx.request.body.email);

      ctx.response.type = "application/json";
      ctx.body = { message: "Email sent" };
    } catch (err) {
      if (err.message && err.message == "User not found") {
        throw err;
      }

      let error: string = "Error requesting password reset.";

      logger.error(
        "[KeyCloakProvider] Error causes (if present): ",
        err.response?.data
      );

      throw new UnprocessableEntityError(error);
    }
  }
}

export default KeycloakProvider;
