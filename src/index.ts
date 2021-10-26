import { createServer } from "http";

import api from "./api.js";
import config from "./config.js";
import wss from "./wss.js";

console.log(new Date(), "using config", config.name);

const server = createServer();
server.listen(config.port);

wss(server);
api(server);

console.log(new Date(), "ready on", config.port);
