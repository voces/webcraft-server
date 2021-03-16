import { Missing404Error } from "../../errors";
import { Route } from "../router";

export const missing: Route = {
	handler: async ({ request, result }) => {
		if (result === undefined && request.method !== "OPTIONS")
			throw new Missing404Error();
		return result;
	},
};
