import Joi from "joi";

import {
	incorrectPassword,
	rateLimit,
	unknownUsername,
	usernameTaken,
} from "../../../errors.js";
import {
	fetchUser,
	fetchUserPassword,
	logUserLogin,
	registerUser,
} from "../../../mysql.js";
import { joiValidation } from "../../joiValidation";
import { rateLimiter } from "../../rateLimiter.js";
import type { Route } from "../../router.js";
import { hash, verify } from "./passwords.js";
import { injectToken } from "./tokens.js";

export const authAnonRoute: Route<
	{ username: string; room: string; token: string },
	{ body: { username: string; room: string } }
> = {
	method: "POST",
	path: "/auth/anon",
	validate: joiValidation(
		Joi.object({
			body: Joi.object({
				username: Joi.string().allow("").required(),
				room: Joi.string(),
			}).required(),
		}),
	),
	handler: async ({
		response,
		validation: {
			body: { username, room = "katma" },
		},
	}) => {
		if (!rateLimiter.test(1.5)) return rateLimit({ response });

		if (username === "") return injectToken({ username: "tim", room });

		const exists = await fetchUser({ username }).catch(console.error);

		if (!exists) return injectToken({ username: username + "*", room });

		return usernameTaken({ response });
	},
};

export const authLoginRoute: Route<
	{ username: string; room: string; token: string },
	{ body: { username: string; password: string; room: string } }
> = {
	method: "POST",
	path: "/auth/login",
	validate: joiValidation(
		Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required(),
				room: Joi.string(),
			}).required(),
		}),
	),
	handler: async ({
		response,
		validation: {
			body: { username, password, room = "katma" },
		},
	}) => {
		if (!rateLimiter.test(3)) return rateLimit({ response });

		const row = await fetchUserPassword({ username }).catch(console.error);

		if (!row) return unknownUsername({ response });

		const match = await verify(row.password.toString("utf-8"), password);

		if (!match) return incorrectPassword({ response });

		logUserLogin({ username });

		return injectToken({ username, room });
	},
};

export const authRegisterRoute: Route<
	{ username: string; room: string; token: string },
	{ body: { username: string; password: string } }
> = {
	method: "POST",
	path: "/auth/register",
	validate: joiValidation(
		Joi.object({
			body: Joi.object({
				username: Joi.string().required(),
				password: Joi.string().required(),
			}).required(),
		}),
	),
	handler: async ({
		response,
		validation: {
			body: { username, password },
		},
	}) => {
		if (!rateLimiter.test(3)) return rateLimit({ response });

		if (username.toLowerCase() === "tim")
			return usernameTaken({ response });

		const exists = await fetchUser({ username }).catch(console.error);

		if (exists) return usernameTaken({ response });

		const hashedPassword = await hash(password);

		await registerUser({ username, password: hashedPassword });

		return injectToken({ username, room: "katma" });
	},
};
