import config from "config";
import { Context, DefaultState, Next } from "koa";
import Router from "koa-router";
import { cloneDeep } from "lodash";
import logger from "logger";
import Utils from "utils";

import Settings, { IApplication } from "services/settings.service";

import KeycloakProvider from "providers/keycloak.provider";

const router: Router = new Router<DefaultState, Context>({ prefix: "/auth" });

async function setCallbackUrl(ctx: Context, next: Next): Promise<void> {
  logger.info("Setting callbackUrl");
  if (!ctx.session.callbackUrl && !ctx.query.callbackUrl) {
    ctx.session.callbackUrl = ctx.headers.referer;
  }
  if (ctx.query.callbackUrl) {
    ctx.session.callbackUrl = ctx.query.callbackUrl;
  }
  if (ctx.request.body.callbackUrl) {
    ctx.session.callbackUrl = ctx.request.body.callbackUrl;
  }

  if (!ctx.session.applications && ctx.query.applications) {
    const applications: string = ctx.query.applications as string;
    ctx.session.applications = applications.split(",");
  }
  if (!ctx.session.generateToken) {
    ctx.session.generateToken = ctx.query.token === "true";
  }
  if (!ctx.session.originApplication || ctx.query.origin) {
    ctx.session.originApplication =
      ctx.query.origin || Settings.getSettings().defaultApp;
  }

  await next();
}

async function loadApplicationGeneralConfig(
  ctx: Context,
  next: Next
): Promise<void> {
  const generalConfig: { application: string } = {
    application: config.get("application"),
  };

  ctx.state.generalConfig = cloneDeep(generalConfig); // avoiding a bug when changes in DB are not applied

  const app: string = Utils.getOriginApp(ctx);
  
  const applicationConfig: IApplication =
    Settings.getSettings().applications &&
    Settings.getSettings().applications[app];

  if (applicationConfig) {
    ctx.state.generalConfig.application = {
      ...ctx.state.generalConfig.application,
      ...applicationConfig,
    };
  }

  await next();
}

router.post("/login", KeycloakProvider.localCallback);

// @ts-ignore
router.post('/check-logged', KeycloakProvider.checkLogged);

// @ts-ignore
router.post('/sign-up', setCallbackUrl, loadApplicationGeneralConfig, KeycloakProvider.signUp);

// @ts-ignore
router.post('/logout', KeycloakProvider.logOut);


// @ts-ignore
router.post('/reset-password', KeycloakProvider.requestPasswordReset);





export default router;
