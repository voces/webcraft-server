import { readFile } from "fs/promises";
import mime from "mime-types";

import { getGames } from "../../rooms";
import type { Route } from "../router";
import { register } from "../router";

const mapsFile: Route<string | undefined, void, { map: string; file: string }> =
	{
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

				// Attach the npm version of the map
				if (file === "index.html")
					try {
						response.setHeader(
							"protocol-version",
							JSON.parse(
								await readFile(
									`maps/${map}/package.json`,
									"utf-8",
								),
							).version,
						);
					} catch {
						/* do nothing */
					}

				return contents;
			} catch {
				/* do nothing */
			}
		},
	};

const mapsClean: Route<string | undefined | unknown, void, { map: string }> = {
	method: "GET",
	path: "/maps/:map",
	handler: async ({ result, request, response, params, ...rest }) => {
		if (result) return result;

		if (!request.url?.endsWith("/")) {
			response.setHeader("location", `/maps/${params.map}/`);
			response.statusCode = 302;
			return;
		}

		return mapsFile.handler({
			result,
			request,
			response,
			params: { ...params, file: "index.html" },
			...rest,
		});
	},
};

const mapsList: Route<string | undefined | unknown, void> = {
	method: "GET",
	path: "/maps",
	handler: async ({ response }) => {
		response.setHeader("Content-Type", "text/html");
		return getGames().then((games) =>
			games.map((g) => `<a href="/maps/${g}">${g}</a>`).join("<br>"),
		);
	},
};

const mapsListRoot: Route<string | undefined | unknown, void> = {
	...mapsList,
	path: "/",
};

export const registerMapsRoutes = (): void => {
	register(mapsFile);
	register(mapsClean);
	register(mapsList);
	register(mapsListRoot);
};
