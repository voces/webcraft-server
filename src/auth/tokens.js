
import jwt from "jsonwebtoken";
import secret from "./secret.js";

export const injectToken = obj =>
	Object.assign( obj, { token: jwt.sign( obj, secret ) } );

export const verifyToken = token => new Promise( resolve => {

	try {

		jwt.verify( token, secret, ( err, result ) => {

			if ( err ) return resolve();
			resolve( result );

		} );

	} catch ( err ) {

		resolve();

	}

} );
