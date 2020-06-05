import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { hash, verify } from "./passwords.js";
import {
	usernameTaken,
	unknownUsername,
	incorrectPassword,
	rateLimit,
} from "../errors.js";
import { injectToken } from "./tokens.js";
import {
	fetchUserPassword,
	logUserLogin,
	fetchUser,
	registerUser,
} from "../mysql.js";
import RateLimiter from "../RateLimiter.js";
import { HapiPayload } from "../types.js";

export default (hapi: Hapi.Server, rateLimiter: RateLimiter): void => {
	hapi.route({
		method: "POST",
		path: "/auth/anon",
		options: {
			validate: {
				payload: Joi.object({
					username: Joi.string().allow("").required(),
				}),
			},
			handler: async (request: HapiPayload<{ username: string }>, h) => {
				if (!rateLimiter.test(1.5)) return rateLimit(h);

				const username: string = request.payload.username;

				if (username === "") return injectToken({ username: "tim" });

				const exists = await fetchUser({ username }).catch(
					console.error,
				);

				if (!exists)
					return injectToken({
						username: username + "*",
					});

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
				}),
			},
			handler: async (
				request: HapiPayload<{ username: string; password: string }>,
				h,
			) => {
				if (!rateLimiter.test(3)) return rateLimit(h);

				const { username, password } = request.payload;

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

				return injectToken({ username });
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

				return injectToken({ username });
			},
		},
	});
};
