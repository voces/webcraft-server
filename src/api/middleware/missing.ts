import { Missing404Error } from "../../errors";
import type { Route } from "../router";

export const missing: Route = {
	handler: async ({ request, result, response }) => {
		if (
			result === undefined &&
			request.method !== "OPTIONS" &&
			response.statusCode === 200
		)
			throw new Missing404Error();
		return result;
	},
};
