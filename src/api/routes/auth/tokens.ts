import jwt from "jsonwebtoken";

import secret from "./secret.js";

export const injectToken = <T extends Parameters<typeof jwt.sign>[0]>(
	obj: T,
): T & { token: string } =>
	Object.assign(obj, { token: jwt.sign(obj, secret) });

export const verifyToken = (token: string): Promise<Record<string, unknown>> =>
	new Promise((resolve, reject) => {
		try {
			jwt.verify(token, secret, (err, result) => {
				if (err) return reject(err);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				resolve(result as any);
			});
		} catch (err) {
			reject(err);
		}
	});
