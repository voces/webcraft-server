
import http from "http";
import WebSocket from "ws";
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { query } from "./mysql.js";

const server = http.createServer();
const wss = new WebSocket.Server( { noServer: true } );

const connections = [];
let id = 0;

const send = json => {

	json.time = Date.now();
	console.log( json );

	const stringified = JSON.stringify( json );

	connections.forEach( connection => {

		try {

			connection.send( stringified );

		} catch ( err ) { /* do nothing */ }

	} );

};

wss.on( "connection", ( ws, req ) => {

	ws.id = id ++;
	const username = req.url.slice( 2 );
	ws.username = username || ws.id.toString();

	try {

		ws.send( JSON.stringify( {
			type: "init",
			connections: connections.length + 1,
		} ) );

	} catch ( err ) { /* do nothing */ }

	connections.push( ws );

	ws.on( "message", message => {

		try {

			const json = JSON.parse( message );
			json.connection = ws.id;
			send( json );

		} catch ( err ) { /* do nothing */ }

	} );

	ws.on( "close", () => {

		connections.splice( connections.indexOf( ws ), 1 );
		send( { type: "disconnection", connection: ws.id } );

	} );

	send( { type: "connection", connection: ws.id, username: ws.username } );

} );

setInterval( () => connections.length && send( { type: "update" } ), 100 );

server.on( "upgrade", ( request, socket, head ) =>
	wss.handleUpgrade( request, socket, head, ws =>
		wss.emit( "connection", ws, request ) ) );

server.listen( 8080 );

const hapi = Hapi.server( {
	listener: server,
	routes: {
		cors: {
			origin: [ "http://localhost:8081", "http://notextures.io" ],
		},
		validate: {
			failAction: ( request, h, err ) => {

				throw err;

			},
		},
	},
} );

hapi.route( {
	method: "POST",
	path: "/error",
	options: {
		response: { emptyStatusCode: 204 },
		handler: async request => {

			const stack = request.payload.stack;
			query( "INSERT INTO errors (stack) VALUES ((:stack));", { stack } ).catch( console.error );
			return "";

		},
		validate: {
			payload: Joi.object( {
				stack: Joi.string().required(),
			} ),
		},
	},
} );

hapi.events.on( "response", request => {

	console.log( request.info.remoteAddress + ": " + request.method.toUpperCase() + " " + request.path + " --> " + request.response.statusCode );

} );
