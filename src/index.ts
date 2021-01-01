import http from "http";

import config from "./config.js";
import hapi from "./hapi.js";
import wss from "./wss.js";

console.log(new Date(), "using config", config.name);

const server = http.createServer();
server.listen(config.port);

wss(server);
hapi(server);

console.log(new Date(), "ready on", config.port);
