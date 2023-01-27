import config from "config";

export interface IApplication {
  name: string;
  logo: string;
  principalColor: string;
}

interface IJwtAuth {
  expiresInMinutes: number;
  secret: string;
  active: boolean;
}
export interface ISettings {
  applications: Record<string, IApplication>;
  publicUrl: string;
  jwt: IJwtAuth;
  defaultApp: string;
}

export default class Settings {
  private static settings: ISettings = null;

  static getSettings(): ISettings {
    if (Settings.settings && process.env.NODE_ENV !== "test") {
      return Settings.settings;
    }

    Settings.settings = {
      applications: {
        eahw: {
          name: "East Africa Hazards Watch",
          logo: "",
          principalColor: "",
        },
      },
      jwt: {
        expiresInMinutes: 0.0,
        secret: `-----BEGIN PUBLIC KEY-----\r\n${config.get(
          "jwt.publicKey"
        )}\r\n-----END PUBLIC KEY-----`,
        active: true,
      },
      publicUrl: config.get("server.publicUrl"),
      defaultApp: config.get("settings.defaultApp"),
    };

    return Settings.settings;
  }
}
