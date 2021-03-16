import { IncomingMessage, ServerResponse } from "http";

import { EmptyObject, InternalRoute, routes, ValidateContext } from "./router";

export const runner = async (
	request: IncomingMessage,
	response: ServerResponse,
): Promise<void> => {
	const matchedRoutes = routes
		.map((route) => {
			if (!request.method || !request.url) return false;

			if (route.method)
				if (typeof route.method === "string") {
					if (route.method !== request.method) return false;
				} else if (!route.method.includes(request.method)) return false;

			let params: unknown | EmptyObject = {};
			if (route.path) {
				params = route.path(request.url);
				if (!params) return false;
			}

			return { route, params };
		})
		.filter(
			(
				v,
			): v is {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				route: InternalRoute<unknown, unknown, any>;
				params: unknown;
			} => v !== false,
		);

	const context: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		request: ValidateContext<any>["request"];
		response: ServerResponse;
		result: unknown;
		params: unknown;
		error?: unknown;
	} = {
		request,
		response,
		result: undefined,
		params: undefined,
	};
	for (const route of matchedRoutes) {
		if (context.error && !route.route.handlesErrors) continue;

		context.params = route.params;

		try {
			const validation = route.route.validate
				? await route.route.validate(context)
				: undefined;

			context.result = await route.route.handler({
				...context,
				validation,
			});
		} catch (err) {
			context.error = err;
			if ("statusCode" in err) response.statusCode = err.statusCode;
		}
	}

	// apiErrors can be treated as safe responses
	const error = context.error;
	if (error && typeof error === "object" && "apiError" in error) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		delete (error as any).apiError;
		context.result = error;
	}

	// Plain objects are desired
	if (typeof context.result === "object") {
		response.setHeader("content-type", "application/json");
		response.write(JSON.stringify(context.result));

		// Strings if we did the stringifying internally
	} else if (typeof context.result === "string") {
		if (!response.hasHeader("content-type"))
			response.setHeader("content-type", "text/plain; charset=UTF-8");
		response.write(context.result);
	}

	// Do not return unknown errors
	else if (context.error) {
		console.error(context.error);
		response.statusCode = 500;
	} else response.write("");

	response.end();
};
