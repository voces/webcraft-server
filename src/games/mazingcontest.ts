import {
	MazingContest,
	Network,
} from "../../mvp-bd-client/public/mazingcontest/server.js";
import type { Game } from "../../mvp-bd-client/src/engine/Game.js";
import { initializeGame, Room } from "../rooms.js";

export const createMazingContest = (): Room =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	initializeGame((new MazingContest(new Network()) as any) as Game);
