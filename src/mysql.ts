import MySQL, { RowDataPacket, OkPacket } from "mysql2/promise.js";

export const raw = MySQL.createPool({
	host: "localhost",
	user: "katma",
	database: "katma",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	supportBigNumbers: true,
	namedPlaceholders: true,
	multipleStatements: true,
});

export const query = (
	query: string,
	values?: Record<string, string | number>,
): Promise<RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[]> =>
	raw
		.query(query, values)
		.then(([result]) => result)
		.catch((err) => err);

export const queryOne = (
	...args: Parameters<typeof query>
): Promise<MySQL.RowDataPacket | MySQL.OkPacket | MySQL.RowDataPacket[]> =>
	query(...args).then((result) => {
		if (!Array.isArray(result)) throw new Error("expected an array");
		return result[0];
	});

export default new Proxy(raw, {
	get: (obj, prop: keyof typeof raw | "queryOne") => {
		if (prop === "query") return query;
		if (prop === "queryOne") return query;

		return obj[prop];
	},
});
