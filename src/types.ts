import type WebSocket from "ws";

import type RateLimiter from "./RateLimiter.js";

export type WebSocketConnection = WebSocket & {
	id: number;
	username: string;
	rateLimiter: RateLimiter;
};
