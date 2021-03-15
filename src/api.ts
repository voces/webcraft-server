import { Server } from "http";

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

// export default (server: Server): void => {
// 	const hapi = Hapi.server({
// 		listener: server,
// 		routes: {
// 			cors: { origin: config.cors },
// 			validate: {
// 				failAction: (request, h, err) => {
// 					throw err;
// 				},
// 			},
// 			files: { relativeTo: join(__dirname, "..", "public") },
// 		},
// 	});

// 	authRoutes(hapi, rateLimiter);

// 	hapi.route({
// 		method: "GET",
// 		path: "/.well-known/{param*}",
// 		handler: { directory: { path: "./.well-known", index: true } },
// 	});

// 	hapi.events.on("response", (request) => {
// 		const response = request.response as Hapi.ResponseObject;

// 		// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 		const error: Error | undefined = (response as any)._error;
// 		if (error) console.error(error);

// 		console.log(
// 			`${request.info.remoteAddress}: ${request.method.toUpperCase()} ${
// 				request.path
// 			} --> ${colorizedStatus(response.statusCode)}`,
// 		);
// 	});
// };
