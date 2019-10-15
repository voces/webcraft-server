
import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import { query, queryOne } from "./mysql.js";
import RateLimiter from "./RateLimiter.js";
import { hash, verify } from "./passwords.js";
import { usernameTaken, unknownUsername, incorrectPassword, rateLimit } from "./errors.js";
import { injectToken } from "./tokens.js";

const rateLimiter = new RateLimiter( { recovery: 3, latency: 100, cap: 10 } );

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

	hapi.route( {
		method: "POST",
		path: "/auth/anon",
		options: {
			validate: {
				payload: Joi.object( {
					username: Joi.string().allow( "" ).required(),
				} ),
			},
			handler: async ( request, h ) => {

				if ( ! rateLimiter.test( 1.5 ) ) return rateLimit( h );

				const username = request.payload.username;

				if ( username === "" )
					return injectToken( { username: "tim" } );

				const exists = await queryOne(
					"SELECT 1 FROM users WHERE username = :username;",
					{ username }
				).catch( console.error );

				if ( ! exists )
					return injectToken( { username: request.payload.username + "*" } );

				return usernameTaken( h );

			},
		},
	} );

	hapi.route( {
		method: "POST",
		path: "/auth/login",
		options: {
			validate: {
				payload: Joi.object( {
					username: Joi.string().required(),
					password: Joi.string().required(),
				} ),
			},
			handler: async( request, h ) => {

				if ( ! rateLimiter.test( 3 ) ) return rateLimit( h );

				const { username, password } = request.payload;

				const row = await queryOne(
					"SELECT password FROM users WHERE username = :username;",
					{ username }
				).catch( console.error );

				if ( ! row )
					return unknownUsername( h );

				const match = await verify( row.password.toString( "utf-8" ), password );

				if ( ! match )
					return incorrectPassword( h );

				return injectToken( { username } );

			},
		},
	} );

	hapi.route( {
		method: "POST",
		path: "/auth/register",
		options: {
			validate: {
				payload: Joi.object( {
					username: Joi.string().required(),
					password: Joi.string().required(),
				} ),
			},
			handler: async( request, h ) => {

				if ( ! rateLimiter.test( 3 ) ) return rateLimit( h );

				const { username, password } = request.payload;

				if ( username.toLowerCase() === "tim" )
					return usernameTaken( h );

				const exists = await queryOne(
					"SELECT 1 FROM users WHERE username = :username;",
					{ username }
				).catch( console.error );

				if ( exists )
					return usernameTaken( h );

				const hashedPassword = await hash( password );

				await query(
					"INSERT INTO users (username, password) VALUES (:username, :password);",
					{ username, password: hashedPassword }
				);

				return injectToken( { username } );

			},
		},
	} );

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
