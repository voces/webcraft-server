
import http from "http";
import WebSocket from "ws";
import Hapi from "@hapi/hapi";

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

wss.on( "connection", ws => {

	try {

		ws.send( JSON.stringify( {
			type: "init",
			connections: connections.length + 1,
		} ) );

	} catch ( err ) { /* do nothing */ }

	connections.push( ws );
	ws.id = id ++;

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

	send( { type: "connection", connection: ws.id } );

} );

server.on( "upgrade", ( request, socket, head ) =>
	wss.handleUpgrade( request, socket, head, ws =>
		wss.emit( "connection", ws ) ) );

server.listen( 8080 );

const hapi = Hapi.server( { listener: server } );

// hapi.route( {
// 	method: "POST",
// 	path: "/error",
// 	handler: ( request, h ) => ( { hello: "World" } ),
// } );
