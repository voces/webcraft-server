
import WebSocket from "ws";
import game from "../mvp-bd-client/src/index.js";
import network from "../mvp-bd-client/src/network.js";

game.receivedState = "host";

const wss = new WebSocket.Server( { noServer: true } );

const connections = [];
let id = 0;

const queue = [];
let lastTime = 0;
const _send = () => {

	const json = queue.shift();

	const stringified = JSON.stringify( json );
	const parsedJson = JSON.parse( stringified );
	if ( json.type !== "update" || Math.random() < 0.01 )
		console.log( parsedJson );

	connections.forEach( connection => {

		try {

			connection.send( stringified );

		} catch ( err ) { /* do nothing */ }

	} );

	try {

		network.dispatchEvent( parsedJson.type, parsedJson );

	} catch ( err ) {

		console.error( err );

	}

	if ( queue.length ) _send();
	else start();

};
const send = network.send = ( json, time ) => {

	if ( ! json.type ) return console.error( new Error( "missing message type" ) );

	json.time = lastTime = Math.max( time || Date.now(), lastTime + 1 );

	queue.push( json );

	if ( queue.length > 1 ) return;
	else _send();

};

wss.on( "connection", ( ws, req ) => {

	ws.id = id ++;
	const username = req.url.slice( 2 );
	ws.username = username || ws.id.toString();

	const time = Date.now();

	try {

		ws.send( JSON.stringify( {
			type: "init",
			connections: connections.length,
			time,
			state: game,
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
		if ( connections.length === 0 )
			stop();

	} );

	send( { type: "connection", connection: ws.id, username: ws.username }, time );

} );

let timeout;
const stop = () => {

	if ( ! timeout ) return;
	clearTimeout( timeout );
	timeout = undefined;

};
const start = () => {

	stop();
	timeout = setTimeout( () => send( { type: "update" } ), 100 );

};

export default server => {

	server.on( "upgrade", ( request, socket, head ) =>
		wss.handleUpgrade( request, socket, head, ws =>
			wss.emit( "connection", ws, request ) ) );

};
