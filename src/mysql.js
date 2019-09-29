
import MySQL from "mysql2/promise.js";

export const raw = MySQL.createPool( {
	host: "localhost",
	user: "mvp-bd",
	database: "mvp_bd",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	supportBigNumbers: true,
	namedPlaceholders: true,
} );

export const query = ( ...args ) => raw.query( ...args ).then( ( [ result ] ) => result ).catch( err => err );

export const queryOne = ( ...args ) => query( ...args ).then( result => result[ 0 ] );

export default new Proxy( raw, { get: ( obj, prop ) => {

	if ( prop !== "query" ) return obj[ prop ];

	return query;

} } );
