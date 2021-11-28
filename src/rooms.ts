import { lstat, mkdir, readFile } from "fs/promises";
import fetch from "node-fetch";
import { maxSatisfying } from "semver";
import tar from "tar";

import type { WebSocketConnection } from "./types.js";

export const LATENCY = 50;

export interface Room {
	connections: ReadonlyArray<WebSocketConnection>;
	send: (json: Record<string, unknown>, time?: number) => void;
	state: Record<string, unknown>;
	stop: () => void;
	addConnection: (connection: WebSocketConnection) => void;
	removeConnection: (connection: WebSocketConnection) => void;
}

type Network = {
	new (): Record<string, unknown>;
};

type Game = {
	new (network: InstanceType<Network>): {
		synchronizationState: "synchronizing" | "synchronized";
		__UNSAFE_network: {
			dispatchEvent: (
				type: string,
				data: Record<string, unknown>,
			) => void;
			send: (data: Record<string, unknown>, time?: number) => void;
		};
		toJSON: () => Record<string, unknown>;
	};
};

type Map = {
	Game: Game;
	Network: Network;
	withGame: <T>(game: InstanceType<Game>, fn: () => T) => T;
};

const extractTarball = (
	stream: NodeJS.ReadableStream,
	protocol: string,
): Promise<Record<string, string | null>> => {
	const data: Record<string, string | null> = {};
	return new Promise((resolve, reject) => {
		mkdir(`maps/${protocol}`, { recursive: true }).then(() => {
			const parser = tar.extract({
				strict: true,
				strip: 1,
				cwd: `maps/${protocol}`,
			});
			stream.pipe(parser);
			parser.on("close", () => resolve(data));
			parser.on("error", reject);
		});
	});
};

type Package = { version: string; dist: { tarball: string }; main: string };

type NpmRegistryEntry = {
	"dist-tags": Record<string, string>;
	versions: Record<string, Package>;
};

const getLatestVersion = async (protocol: string, range: string) => {
	const registry = await fetch(`https://registry.npmjs.org/${protocol}`).then(
		(r) => r.json() as Promise<NpmRegistryEntry>,
	);

	// A tagged version, like @latest or @alpha
	if (registry["dist-tags"][range])
		return registry.versions[registry["dist-tags"][range]];

	// An explicit version, like @2.3.5
	if (registry.versions[range]) return registry.versions[range];

	const version = maxSatisfying(Object.keys(registry.versions), range);

	if (version && registry.versions[version])
		return registry.versions[version];

	throw new Error(`Could not find valid version for ${protocol}@${range}`);
};

const fetchLatest = async (
	protocol: string,
	targetVersion: string,
	currentVersion: string | undefined,
): Promise<Package | undefined> => {
	// Fetch latest version/tarball url
	console.log(new Date(), `fetching latest ${protocol}@${targetVersion}`);
	const data = await getLatestVersion(protocol, targetVersion);

	if (data.version === currentVersion) return;

	// Fetch the latest version if it is different than the current one
	console.log(
		new Date(),
		`fetching ${protocol}@${data.version} tarball at ${data.dist.tarball}`,
	);

	const res = await fetch(data.dist.tarball);
	if (!res.body) {
		console.error(
			new Error(`No body when fetching ${protocol}@${data.version}`),
		);
		return;
	}

	console.log(new Date(), `extracting ${protocol}`);
	await extractTarball(res.body, protocol);

	console.log(new Date(), `loading ${protocol}`);
	try {
		return JSON.parse(
			await readFile(`maps/${protocol}/package.json`, "utf-8"),
		);
	} catch (err) {
		console.error(err);
	}
};

const importMap = async (
	protocol: string,
	targetVersion: string,
): Promise<Map> => {
	// Fetch current version, if it exists
	let currentVersion: string | undefined;
	let mapPackage: Package | undefined;
	let linked = false;
	try {
		mapPackage = JSON.parse(
			await readFile(`maps/${protocol}/package.json`, "utf-8"),
		);
		currentVersion = mapPackage?.version;
		linked = await lstat(`maps/${protocol}`).then((s) =>
			s.isSymbolicLink(),
		);
	} catch {
		/* do nothing */
	}

	// Fetch latest version/tarball url
	mapPackage = linked
		? mapPackage
		: (await fetchLatest(protocol, targetVersion, currentVersion)) ??
		  mapPackage;

	if (!mapPackage) throw new Error(`Could not import ${protocol}`);
	else if (currentVersion === mapPackage.version)
		console.log(
			new Date(),
			`using existing ${
				linked ? "(linked) " : ""
			}${protocol}@${currentVersion}`,
		);

	// Load the map
	let map;
	// This makes esbuild happy
	// eslint-disable-next-line no-useless-catch
	try {
		map = await import(`../maps/${protocol}/${mapPackage.main}`).then(
			(i) => i.default,
		);
	} catch (err) {
		throw err;
	}

	// Validate correct format
	if (typeof map.Game !== "function")
		throw new Error(`Expected ${protocol} to export a Game class`);
	if (typeof map.Network !== "function")
		throw new Error(`Expected ${protocol} to export a Network class`);
	if (typeof map.withGame !== "function")
		throw new Error(`Expected ${protocol} to export a withGame function`);

	return map;
};

export const loadGame = async (
	protocol: string,
	version: string,
): Promise<Room> => {
	const { Game, Network, withGame } = await importMap(protocol, version);
	const game = new Game(new Network());

	game.synchronizationState = "synchronized";

	const connections: WebSocketConnection[] = [];

	const queue: Record<string, unknown>[] = [];
	let lastTime = 0;
	const _send = () => {
		const json = queue.shift();
		if (!json) return;

		const stringified = JSON.stringify(json);
		const parsedJson = JSON.parse(stringified);

		connections.forEach((connection) => {
			try {
				connection.send(stringified);
			} catch (err) {
				/* do nothing */
			}
		});

		try {
			game.__UNSAFE_network.dispatchEvent(parsedJson.type, parsedJson);
		} catch (err) {
			console.error(err);
		}

		if (queue.length) _send();
		else start();
	};

	const send = (game.__UNSAFE_network.send = (
		json: Record<string, unknown>,
		time?: number,
	) => {
		if (!json.type) return console.error(new Error("missing message type"));

		json.time = lastTime = Math.max(time ?? Date.now(), lastTime + 1);

		queue.push(json);

		if (queue.length > 1) return;
		else _send();
	});

	let timeout: NodeJS.Timeout | undefined;
	const stop = () => {
		if (!timeout) return;
		clearTimeout(timeout);
		timeout = undefined;
	};

	const start = () => {
		stop();
		timeout = setTimeout(() => {
			send({ type: "update" });
			connections.forEach((connection) => connection.rateLimiter.tick());
		}, LATENCY);
	};

	return {
		connections,
		send,
		state: { toJSON: () => withGame(game, () => game.toJSON()) },
		stop,
		addConnection: (ws) => connections.push(ws),
		removeConnection: (ws) => {
			connections.splice(connections.indexOf(ws), 1);
			send({ type: "disconnection", connection: ws.id });
			if (connections.length === 0) stop();
		},
	};
};

export const getGames = async (): Promise<[string, string][]> =>
	readFile("games.txt", "utf-8").then((file) =>
		file.split("\n").map((f) => {
			const [protocol, version] = f.split("@");
			return [protocol, version ?? "latest"];
		}),
	);
