import { Game } from "../mvp-bd-client/public/mazingcontest/js/server.js";
import { WebSocketConnection } from "./types.js";

export const LATENCY = 50;

export interface Room {
	connections: ReadonlyArray<WebSocketConnection>;
	send: (json: Record<string, unknown>, time?: number) => void;
	state: Record<string, unknown>;
	stop: () => void;
	addConnection: (connection: WebSocketConnection) => void;
	removeConnection: (connection: WebSocketConnection) => void;
}

export const initializeGame = <T extends Game>(game: T): Room => {
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

		json.time = lastTime = Math.max(time || Date.now(), lastTime + 1);

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
		state: { toJSON: () => game.toJSON() },
		stop,
		addConnection: (ws) => connections.push(ws),
		removeConnection: (ws) => {
			connections.splice(connections.indexOf(ws), 1);
			send({ type: "disconnection", connection: ws.id });
			if (connections.length === 0) stop();
		},
	};
};
