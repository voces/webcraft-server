import { jsonError, MissingBodyError } from "../../errors";
import { Route } from "../router";

const methods: (string | undefined)[] = ["POST"];

export const jsonBody: Route = {
	handler: ({ request, response }) => {
		if (!methods.includes(request.method)) return;

		let pResolve: (value: unknown) => void;
		let pReject: (reason?: unknown) => void;
		const p = new Promise((resolve, reject) => {
			pResolve = resolve;
			pReject = reject;
		});

		let data = "";
		request.on("data", (chunk) => {
			data += chunk;
		});
		request.on("end", () => {
			if (!data) pReject(new MissingBodyError());

			try {
				request.json = JSON.parse(data);
				pResolve(undefined);
			} catch (err) {
				console.log("error");
				pReject(jsonError({ response }));
			}
		});

		return p;
	},
};
