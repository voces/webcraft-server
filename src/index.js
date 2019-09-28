
import WebSocket from "ws";

const wss = new WebSocket.Server( { port: 8080 } );

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

