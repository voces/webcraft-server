import Hapi from "@hapi/hapi";
import inert from "@hapi/inert";
import chalk from "chalk";
import { Server } from "http";
import Joi from "joi";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./auth/routes.js";
import config from "./config.js";
import { rateLimit } from "./errors.js";
import { logError } from "./mysql.js";
import RateLimiter from "./RateLimiter.js";
import { HapiPayload } from "./types.js";

const rateLimiter = new RateLimiter({ recovery: 3, latency: 100, cap: 10 });

const colorizedStatus = (status: number) => {
	if (status < 400) return chalk.green(status);
	if (status < 500) return chalk.yellow(status);
	return chalk.red(status);
};

console.log(join(dirname(fileURLToPath(import.meta.url)), "..", "public"));

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
		path: "/.well-known/{param*}",
		handler: { directory: { path: "./.well-known", index: true } },
	});

	hapi.events.on("response", (request) => {
		const response = request.response as Hapi.ResponseObject;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const error: Error | undefined = (response as any)._error;
		if (error) console.error(error);

		console.log(
			`${request.info.remoteAddress}: ${request.method.toUpperCase()} ${
				request.path
			} --> ${colorizedStatus(response.statusCode)}`,
		);
	});
};

setInterval(() => rateLimiter.tick(), 100);
