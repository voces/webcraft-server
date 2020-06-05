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

const query = (
	query: string,
	values?: Record<string, string | number>,
): Promise<RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[]> =>
	raw
		.query(query, values)
		.then(([result]) => result)
		.catch((err) => err);

const queryOne = (
	...args: Parameters<typeof query>
): Promise<MySQL.RowDataPacket | MySQL.OkPacket | MySQL.RowDataPacket[]> =>
	query(...args).then((result) => {
		if (!Array.isArray(result)) throw new Error("expected an array");
		return result[0];
	});

const typedQueryOne = <Values extends Record<string, string | number>, Return>(
	query: string,
) => (values: Values): Promise<Return> =>
	queryOne(query, values) as Promise<Return>;

const emptyTypedQueryOne = <Return>(query: string) => (): Promise<Return> =>
	queryOne(query) as Promise<Return>;

// users

export const fetchUser = typedQueryOne<
	{ username: string },
	{ username: string } | undefined
>("SELECT username FROM users WHERE username = :username;");

export const fetchUserPassword = typedQueryOne<
	{ username: string },
	{ password: Buffer } | undefined
>("SELECT password FROM users WHERE username = :username;");

export const registerUser = typedQueryOne<
	{ username: string; password: string },
	MySQL.OkPacket
>("INSERT INTO users (username, password) VALUES (:username, :password);");

export const logUserLogin = typedQueryOne<{ username: string }, MySQL.OkPacket>(
	"UPDATE users SET logged_in_at = NOW() WHERE username = :username;",
);

export const deletedInactiveAccounts = emptyTypedQueryOne<
	[MySQL.OkPacket, MySQL.OkPacket]
>(`
	INSERT INTO deleted_users VALUES SELECT *, "inactive" reason FROM users WHERE logged_in_at < NOW() - INTERVAL 3 MONTH;
	DELETE FROM users WHERE logged_in_at < NOW() - INTERVAL 3 MONTH;
`);

// Errors

export const logError = typedQueryOne<{ stack: string }, MySQL.OkPacket>(
	"INSERT INTO errors (stack) VALUES ((:stack));",
);
