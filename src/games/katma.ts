import {
	Katma,
	Network,
	withGame,
} from "../../mvp-bd-client/public/katma/server.js";
import type { Game } from "../../mvp-bd-client/src/engine/Game.js";
import { initializeGame, Room } from "../rooms.js";

export const createKatma = (): Room =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	initializeGame((new Katma(new Network()) as any) as Game, withGame);
