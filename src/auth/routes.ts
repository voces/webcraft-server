import Hapi from "@hapi/hapi";
import Joi from "joi";

import {
	incorrectPassword,
	rateLimit,
	unknownUsername,
	usernameTaken,
} from "../errors.js";
import {
	fetchUser,
	fetchUserPassword,
	logUserLogin,
	registerUser,
} from "../mysql.js";
import RateLimiter from "../RateLimiter.js";
import { HapiPayload } from "../types.js";
import { hash, verify } from "./passwords.js";
import { injectToken } from "./tokens.js";

export default (hapi: Hapi.Server, rateLimiter: RateLimiter): void => {
	hapi.route({
		method: "POST",
		path: "/auth/anon",
		options: {
			validate: {
				payload: Joi.object({
					username: Joi.string().allow("").required(),
					room: Joi.string(),
				}),
			},
			handler: async (
				request: HapiPayload<{ username: string; room?: string }>,
				h,
			) => {
				if (!rateLimiter.test(1.5)) return rateLimit(h);

				const username = request.payload.username;
				const room = request.payload.room || "katma";

				if (username === "")
					return injectToken({ username: "tim", room });

				const exists = await fetchUser({ username }).catch(
					console.error,
				);

				if (!exists)
					return injectToken({ username: username + "*", room });

				return usernameTaken(h);
			},
		},
	});

	hapi.route({
		method: "POST",
		path: "/auth/login",
		options: {
			validate: {
				payload: Joi.object({
					username: Joi.string().required(),
					password: Joi.string().required(),
					room: Joi.string(),
				}),
			},
			handler: async (
				request: HapiPayload<{
					username: string;
					password: string;
					room?: string;
				}>,
				h,
			) => {
				if (!rateLimiter.test(3)) return rateLimit(h);

				const { username, password } = request.payload;
				const room = request.payload.room ?? "katma";

				const row = await fetchUserPassword({ username }).catch(
					console.error,
				);

				if (!row) return unknownUsername(h);

				const match = await verify(
					row.password.toString("utf-8"),
					password,
				);

				if (!match) return incorrectPassword(h);

				logUserLogin({ username });

				return injectToken({ username, room });
			},
		},
	});

	hapi.route({
		method: "POST",
		path: "/auth/register",
		options: {
			validate: {
				payload: Joi.object({
					username: Joi.string().required(),
					password: Joi.string().required(),
				}),
			},
			handler: async (
				request: HapiPayload<{ username: string; password: string }>,
				h,
			) => {
				if (!rateLimiter.test(3)) return rateLimit(h);

				const { username, password } = request.payload;

				if (username.toLowerCase() === "tim") return usernameTaken(h);

				const exists = await fetchUser({ username }).catch(
					console.error,
				);

				if (exists) return usernameTaken(h);

				const hashedPassword = await hash(password);

				await registerUser({ username, password: hashedPassword });

				return injectToken({ username, room: "katma" });
			},
		},
	});
};
