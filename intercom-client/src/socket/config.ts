import { ClientConfig, DEFAULT_PORT } from "../shared";
import * as secret from "./config.secret";

const s:any = secret.config;
export const loadConfig = (): ClientConfig => {
    return {
        serverHost: s.serverHost,
        serverPort: DEFAULT_PORT,
    }
}