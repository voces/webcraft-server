import { readFile } from "fs/promises";
import mime from "mime-types";

import { register, Route } from "../router";

const maps: Route<string | undefined, void, { map: string; file: string }> = {
	method: "GET",
	path: "/maps/:map/:file",
	handler: async ({ response, params: { map, file } }) => {
		try {
			const contents = await readFile(
				`maps/${map}/public/${file}`,
				"utf-8",
			);
			const type = mime.lookup(file);
			response.setHeader("content-type", type || "text/plain");
			return contents;
		} catch {
			/* do nothing */
		}
	},
};

const mapsClean: Route<string | undefined | unknown, void, { map: string }> = {
	method: "GET",
	path: "/maps/:map/",
	handler: async (props) =>
		props.result ??
		maps.handler({
			...props,
			params: { ...props.params, file: "index.html" },
		}),
};

const mapsCleanRedirect: Route<
	string | undefined | unknown,
	void,
	{ map: string }
> = {
	method: "GET",
	path: "/maps/:map",
	handler: async ({ result, response, params: { map } }) => {
		if (result) return result;
		if (map.endsWith("/")) return;

		response.setHeader("location", `/maps/${map}/`);
		response.statusCode = 302;
	},
};

export const registerMapsRoutes = (): void => {
	register(maps);
	register(mapsClean);
	register(mapsCleanRedirect);
};
