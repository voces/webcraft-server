import { Katma, Network } from "../../mvp-bd-client/public/katma/js/server.js";
import { initializeGame, Room } from "../rooms.js";

export const createKatma = (): Room => initializeGame(new Katma(new Network()));
