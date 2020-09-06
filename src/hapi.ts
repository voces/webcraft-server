import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import chalk from "chalk";
import { logError } from "./mysql.js";
import RateLimiter from "./RateLimiter.js";
import authRoutes from "./auth/routes.js";
import config from "./config.js";
import { rateLimit } from "./errors.js";
import { Server } from "http";
import { HapiPayload } from "./types.js";
import inert from "@hapi/inert";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const rateLimiter = new RateLimiter({ recovery: 3, latency: 100, cap: 10 });

const colorizedStatus = (status: number) => {
	if (status < 300) return chalk.blue(status);
	if (status < 400) return chalk.green(status);
	if (status < 500) return chalk.yellow(status);
	return chalk.red(status);
};

export default (server: Server): void => {
	const hapi = Hapi.server({
		listener: server,
		routes: {
			cors: { origin: config.cors },
			validate: {
				failAction: (request, h, err) => {
					throw err;
				},
			},
			files: {
				relativeTo: join(
					dirname(fileURLToPath(import.meta.url)),
					"..",
					"public",
				),
			},
		},
	});

	hapi.register(inert);

	hapi.route({
		method: "POST",
		path: "/error",
		options: {
			response: { emptyStatusCode: 204 },
			validate: {
				payload: Joi.object({
					stack: Joi.string().required(),
				}),
			},
			handler: async (request: HapiPayload<{ stack: string }>, h) => {
				if (!rateLimiter.test()) return rateLimit(h);

				const stack = request.payload.stack;
				logError({ stack }).catch(console.error);
				return "";
			},
		},
	});

	authRoutes(hapi, rateLimiter);

	hapi.route({
		method: "GET",
		path: "/{param*}",
		handler: { directory: { path: "." } },
	});

	hapi.events.on("response", (request) => {
		console.log(
			request.info.remoteAddress +
				": " +
				request.method.toUpperCase() +
				" " +
				request.path +
				" --> " +
				colorizedStatus(
					(request.response as Hapi.ResponseObject).statusCode,
				),
		);
	});
};

setInterval(() => rateLimiter.tick(), 100);
