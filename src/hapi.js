
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { query } from "./mysql.js";

export default server => {

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

};

