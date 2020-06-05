import http from "http";
import wss from "./wss.js";
import hapi from "./hapi.js";
import config from "./config.js";

console.log(new Date(), "using config", config.name);

const server = http.createServer();
server.listen(config.port);

wss(server);
hapi(server);

console.log(new Date(), "ready on", config.port);
