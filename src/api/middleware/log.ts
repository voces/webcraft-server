import chalk from "chalk";

import { Route } from "../router";

const colorizedStatus = (status: number) => {
	if (status < 400) return chalk.green(status);
	if (status < 500) return chalk.yellow(status);
	return chalk.red(status);
};

export const log: Route = {
	handler: async ({ request, response, result }) => {
		console.log(
			new Date(),
			`${
				request.socket.remoteAddress
			}: ${request.method?.toUpperCase()} ${
				request.url
			} --> ${colorizedStatus(response.statusCode)}`,
		);
		return result;
	},
	handlesErrors: true,
};
