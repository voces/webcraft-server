import WebSocket from "ws";
import RateLimiter from "./RateLimiter.js";
import { verifyToken } from "./auth/tokens.js";
import { Server } from "http";
import { Network } from "../mvp-bd-client/public/js/Network.js";
import { Game } from "../mvp-bd-client/public/js/Game.js";

const network = new Network();
const game = new Game(network);

type WebSocketConnection = WebSocket & {
	id: number;
	username: string;
	rateLimiter: RateLimiter;
};

export const LATENCY = 50;
const MAX_MESSAGE_LENGTH = 2500;

game.receivedState = "host";

const wss = new WebSocket.Server({ noServer: true });

const connections: WebSocketConnection[] = [];
let id = 0;

const queue: Record<string, unknown>[] = [];
let lastTime = 0;
const _send = () => {
	const json = queue.shift();
	if (!json) return;

	const stringified = JSON.stringify(json);
	const parsedJson = JSON.parse(stringified);
	if (json.type !== "update" || Math.random() < 0.01) console.log(parsedJson);

	connections.forEach((connection) => {
		try {
			connection.send(stringified);
		} catch (err) {
			/* do nothing */
		}
	});

	try {
		network.dispatchEvent(parsedJson.type, parsedJson);
	} catch (err) {
		console.error(err);
	}

	if (queue.length) _send();
	else start();
};

const send = (network.send = (json: Record<string, unknown>, time?: number) => {
	if (!json.type) return console.error(new Error("missing message type"));

	json.time = lastTime = Math.max(time || Date.now(), lastTime + 1);

	queue.push(json);

	if (queue.length > 1) return;
	else _send();
});

wss.on("connection", async (ws: WebSocketConnection, req) => {
	ws.id = id++;
	const token = req.url?.slice(2);
	if (!token || !token.length) return ws.close();

	const obj: { username: string } = await verifyToken(token).catch(
		(err) => err,
	);
	if (!obj) return ws.close();

	const { username } = obj;

	ws.username = username || ws.id.toString();

	const time = Date.now();

	try {
		ws.send(
			JSON.stringify({
				type: "init",
				connections: connections.length,
				time,
				state: game,
			}),
		);
	} catch (err) {
		/* do nothing */
	}

	connections.push(ws);

	ws.rateLimiter = new RateLimiter();

	ws.on("message", (message: string) => {
		if (!ws.rateLimiter.test())
			return console.log("dropping message due to spam");
		if (message.length > MAX_MESSAGE_LENGTH)
			return console.log("dropping message due to length");

		try {
			const json = JSON.parse(message);
			json.connection = ws.id;
			send(json);
		} catch (err) {
			/* do nothing */
		}
	});

	ws.on("close", () => {
		connections.splice(connections.indexOf(ws), 1);
		send({ type: "disconnection", connection: ws.id });
		if (connections.length === 0) stop();
	});

	send(
		{ type: "connection", connection: ws.id, username: ws.username },
		time,
	);
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

export default (server: Server): void => {
	server.on("upgrade", (request, socket, head) =>
		wss.handleUpgrade(request, socket, head, (ws) =>
			wss.emit("connection", ws, request),
		),
	);
};
