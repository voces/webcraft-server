import config from "../../config";
import type { Route } from "../router";

export const cors: Route<void> = {
	handler: async ({ request, response }) => {
		response.setHeader("access-control-request-method", "POST");
		response.setHeader("access-control-allow-headers", "content-type");
		if (
			request.headers.origin &&
			config.cors.includes(request.headers.origin)
		)
			response.setHeader(
				"access-control-allow-origin",
				request.headers.origin,
			);
	},
};
