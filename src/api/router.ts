import type { IncomingMessage, ServerResponse } from "http";

import type { ApiError } from "../errors";

const emptyObject = Object.freeze({});
export type EmptyObject = typeof emptyObject;

/**
 * Context that is pased to the route validate function
 */
export interface ValidateContext<Params extends Record<string, unknown>> {
	request: IncomingMessage & { json?: unknown };
	response: ServerResponse;
	params: Params;
	result: unknown;
}

/**
 * Context that is passed to the route handler function
 */
export interface HandlerContext<
	Params extends EmptyObject = EmptyObject,
	Validation = unknown,
> extends ValidateContext<Params> {
	validation: Validation;
}

/**
 * The route handler
 */
type Handler<Params extends EmptyObject, Validation, Response> = (
	context: HandlerContext<Params, Validation>,
) => Response | ApiError | Promise<Response | ApiError>;

type ValidationProps<
	Validation,
	Params extends EmptyObject,
> = Validation extends void
	? EmptyObject
	: {
			validate: (
				context: ValidateContext<Params>,
			) => Validation | Promise<Validation>;
	  };

interface RouteBase<Response, Validation, Params extends EmptyObject> {
	method?: string | string[];
	handler: Handler<Params, Validation, Response>;
}

/**
 * An internal route. Path has been converted to a function that extracts
 * params.
 */
export type InternalRoute<
	Response,
	Validation = void,
	Params extends EmptyObject = EmptyObject,
> = RouteBase<Response, Validation, Params> & {
	path?: (path: string) => Params | undefined;
	rawPath?: string;
	handlesErrors: boolean;
} & ValidationProps<Validation, Params>;

/**
 * A route configuration.
 */
export type Route<
	Response = unknown,
	Validation = void,
	Params extends EmptyObject = EmptyObject,
> = RouteBase<Response, Validation, Params> & {
	path?: string;
	handlesErrors?: boolean;
} & ValidationProps<Validation, Params>;

/**
 * Internal array of routes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _routes: InternalRoute<unknown, unknown, any>[] = [];

const escapeRegex = (string: string) =>
	string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

/**
 * Registers a route/middleware. Routes are processed in the order they are
 * registered, and all matched routes will be invoked.
 */
export const register = <Response, Validation, Params>(
	config: Route<Response, Validation, Params>,
): void => {
	let path;
	if (config.path) {
		const regexp = new RegExp(
			"^" + escapeRegex(config.path).replace(/:\w+/g, "(.+)") + "$",
		);
		const params = Array.from(config.path.matchAll(/:\w+/g)).map((v) =>
			v[0].slice(1),
		);
		path = (path: string) => {
			const result = regexp.exec(path)?.slice(1);
			if (!result || result.length !== params.length) return;
			return Object.fromEntries(
				params.map((param, idx) => [param, result[idx]]),
			);
		};
	}

	_routes.push({
		...config,
		path,
		rawPath: config.path,
		handlesErrors: config.handlesErrors ?? false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any);
};

/**
 * Read only view of all routes.
 */
export const routes: ReadonlyArray<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	InternalRoute<unknown, unknown, any>
> = _routes;
