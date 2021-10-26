import { readFile } from "fs/promises";
import mime from "mime-types";

import type { Route } from "../router";

export const certs: Route<string | undefined, void, { file: string }> = {
	method: "GET",
	path: "/.well-known/acme-challenge/:file",
	handler: async ({ response, params: { file } }) => {
		try {
			const contents = await readFile(
				`public/.well-known/acme-challenge/${file}`,
				"utf-8",
			);
			const type = mime.lookup(file);
			response.setHeader("content-type", type || "text/plain");
			return contents;
		} catch (err) {
			console.error(err);
			/* do nothing */
		}
	},
};
