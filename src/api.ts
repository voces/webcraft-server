import type { Server } from "http";

import { cors } from "./api/middleware/cors";
import { jsonBody } from "./api/middleware/jsonBody";
import { log } from "./api/middleware/log";
import { missing } from "./api/middleware/missing";
import { register } from "./api/router";
import { registerApiRoutes } from "./api/routes";
import { runner } from "./api/runner";

export default (server: Server): void => {
	server.on("request", runner);
};

register(cors);
register(jsonBody);
registerApiRoutes();
register(missing);
register(log);

// 	authRoutes(hapi, rateLimiter);
