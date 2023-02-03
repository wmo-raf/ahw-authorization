import { IUser } from "services/keycloak.interfaces";
import Application, { Context, Next } from "koa";
import passport from "koa-passport";
import jwt, { Options } from "koa-jwt";
import { TokenSet } from "openid-client";

import jswt, { JwtPayload } from "jsonwebtoken";

import logger from "logger";
import Settings from "services/settings.service";
import AuthRouter from "routes/auth.router";
import KeyCloakService from "services/keycloak.service";
import KeyCloakRefreshService from "services/keycloak.refresh.service";

export function loadRoutes(app: Application): void {
  logger.debug("Loading OAuth middleware...");

  app.use(passport.initialize());
  app.use(passport.session());

  const getToken: (ctx: Context, opts: Options) => string = (
    ctx: Context,
    opts: Options
  ) => {
    // External requests use the standard 'authorization' header, but internal requests use 'authentication' instead
    // so we need a custom function to load the token. Why don't we use authorization on both will always elude me...

    if (
      !ctx.headers ||
      (!ctx.headers.authorization && !ctx.headers.authentication)
    ) {
      return "";
    }

    if (ctx.headers.authentication && !ctx.headers.authorization) {
      /**
       * @deprecate Use the `authorization` header instead.
       */
      return ctx.headers.authentication as string;
    }

    const parts: string[] = ctx.headers.authorization.split(" ");

    if (parts.length === 2) {
      const scheme: string = parts[0];
      const credentials: string = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        return credentials;
      }
    }

    if (!opts.passthrough) {
      ctx.throw(
        401,
        'Bad Authorization header format. Format is "Authorization: Bearer <token>"'
      );
      return "";
    }

    return "";
  };

  logger.debug("Loading JWT middleware...");

  app.use(
    jwt({
      secret: Settings.getSettings().jwt.secret,
      passthrough: true,
      isRevoked: KeyCloakService.checkRevokedToken,
      algorithms: ["RS256"],
      getToken,
    })
  );

  logger.debug("Loading JWT validation middleware...");
  app.use(async (ctx: Context, next: Next) => {
    if (
      ctx.state.jwtOriginalError?.message === "jwt expired" &&
      ctx.request.body.refreshToken &&
      ctx.request.body?.grantType === "refresh_token"
    ) {
      logger.debug("Refreshing Token");

      try {
        const token: TokenSet = await KeyCloakRefreshService.resfreshToken(
          ctx.request.body.refreshToken
        );

        const tokenData = jswt.decode(token.access_token);

        ctx.state.user = tokenData;
        ctx.state.user.newAccessToken = token.access_token;
        ctx.state.user.newRefreshToken = token.refresh_token;
      } catch (error) {
        logger.debug("Error Refreshing token", error);
      }
    }

    if (ctx.state.jwtOriginalError?.message === "Token revoked") {
      return ctx.throw(
        401,
        "Your token is outdated. Please use /auth/login to login to generate a new token."
      );
    }

    if (ctx.state.jwtOriginalError?.message === "jwt malformed") {
      return ctx.throw(
        401,
        "Your token is invalid. Please use /auth/login to login and /auth/generate-token to generate a new token."
      );
    }

    return next();
  });

  // Load routes
  logger.debug("Loading routes...");
  app.use(AuthRouter.routes());

  logger.debug("Loaded routes correctly!");
}
