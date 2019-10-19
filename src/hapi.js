
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { query } from "./mysql.js";
import RateLimiter from "./RateLimiter.js";
import authRoutes from "./auth/routes.js";
import config from "./config.js";
import { rateLimit } from "./errors.js";

const rateLimiter = new RateLimiter( { recovery: 3, latency: 100, cap: 10 } );

export default server => {

	const hapi = Hapi.server( {
		listener: server,
		routes: {
			cors: { origin: config.cors },
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
			validate: {
				payload: Joi.object( {
					stack: Joi.string().required(),
				} ),
			},
			handler: async ( request, h ) => {

				if ( ! rateLimiter.test() ) return rateLimit( h );

				const stack = request.payload.stack;
				query(
					"INSERT INTO errors (stack) VALUES ((:stack));",
					{ stack }
				).catch( console.error );
				return "";

			},
		},
	} );

	authRoutes( hapi, rateLimiter );

	hapi.events.on( "response", request => {

		console.log(
			request.info.remoteAddress +
			": " +
			request.method.toUpperCase() +
			" " +
			request.path +
			" --> " +
			request.response.statusCode
		);

	} );

};

setInterval( () => rateLimiter.tick(), 100 );
