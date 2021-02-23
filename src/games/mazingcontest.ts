import {
	MazingContest,
	Network,
} from "../../mvp-bd-client/public/mazingcontest/js/server.js";
import { initializeGame, Room } from "../rooms.js";

export const createMazingContest = (): Room =>
	initializeGame(new MazingContest(new Network()));
