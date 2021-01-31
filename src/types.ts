import Hapi from "@hapi/hapi";
import WebSocket from "ws";

import RateLimiter from "./RateLimiter.js";

export type HapiPayload<Payload, Request = Hapi.Request> = Request & {
	payload: Payload;
};

export type WebSocketConnection = WebSocket & {
	id: number;
	username: string;
	rateLimiter: RateLimiter;
};
