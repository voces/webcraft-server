import type { Server } from "http";
import { WebSocketServer } from "ws";

import { verifyToken } from "./api/routes/auth/tokens.js";
import RateLimiter from "./RateLimiter.js";
import type { Room } from "./rooms.js";
import { loadGame } from "./rooms.js";
import type { WebSocketConnection } from "./types.js";

const MAX_MESSAGE_LENGTH = 2500;

const wss = new WebSocketServer({ noServer: true });

const rooms: Record<string, Room> = {};

let id = 0;
wss.on("connection", async (ws: WebSocketConnection, req) => {
	const token = req.url?.slice(2);
	if (!token || !token.length) {
		console.log(new Date(), "Dropping client without token");
		return ws.close();
	}

	const obj: { username: string; room: string } = await verifyToken(
		token,
	).catch((err) => err);
	if (!obj || obj instanceof Error) {
		console.log(new Date(), "Dropping client with invalid token");
		return ws.close();
	}

	const { username, room: roomId } = obj;

	const room = rooms[roomId];
	if (!room) {
		console.log(new Date(), "Dropping client with invalid room");
		return ws.close();
	}

	ws.id = id++;
	ws.username = username || ws.id.toString();

	const time = Date.now();

	try {
		ws.send(
			JSON.stringify({
				type: "init",
				connections: room.connections.length,
				time,
				state: room.state,
			}),
		);
	} catch (err) {
		console.error(new Date(), err);
	}

	room.addConnection(ws);

	ws.rateLimiter = new RateLimiter();

	ws.on("message", (message: string) => {
		if (!ws.rateLimiter.test())
			return console.log("dropping message due to spam");
		if (message.length > MAX_MESSAGE_LENGTH)
			return console.log("dropping message due to length");

		try {
			const json = JSON.parse(message);
			json.connection = ws.id;
			room.send(json);
		} catch (err) {
			/* do nothing */
		}
	});

	ws.on("close", () => room.removeConnection(ws));

	room.send(
		{ type: "connection", connection: ws.id, username: ws.username },
		time,
	);
});

export default (server: Server): void => {
	server.on("upgrade", (request, socket, head) =>
		wss.handleUpgrade(request, socket, head, (ws) =>
			wss.emit("connection", ws, request),
		),
	);

	loadGame("katma")
		.then((room) => (rooms.katma = room))
		.catch(console.error);
	loadGame("mazingcontest")
		.then((room) => (rooms.mazingcontest = room))
		.catch(console.error);
};
