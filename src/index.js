
import http from "http";
import wss from "./wss.js";
import hapi from "./hapi.js";

const server = http.createServer();
server.listen( 8080 );

wss( server );
hapi( server );

console.log( "ready" );
