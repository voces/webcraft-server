import Joi from "joi";

import { rateLimit } from "../../errors";
import { logError } from "../../mysql";
import { joiValidation } from "../joiValidation";
import { rateLimiter } from "../rateLimiter";
import { Route } from "../router";

export const error: Route<"", { body: { stack: string } }> = {
	method: "POST",
	path: "/error",
	validate: joiValidation(
		Joi.object({
			body: Joi.object({ stack: Joi.string().required() }).required(),
		}),
	),
	handler: async (context) => {
		console.log("handler");
		const {
			validation: {
				body: { stack },
			},
		} = context;
		if (!rateLimiter.test()) return rateLimit(context);

		logError({ stack }).catch(console.error);

		return "";
	},
};
