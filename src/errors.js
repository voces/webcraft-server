
export const usernameTaken = h => h.response( {
	code: 0,
	message: "Username taken.",
	field: "username",
} ).code( 400 );

export const incorrectPassword = h => h.response( {
	code: 1,
	message: "Incorrect password.",
	field: "password",
} ).code( 400 );

export const unknownUsername = h => h.response( {
	code: 2,
	message: "Account does not exist.",
	field: "username",
} ).code( 400 );

export const rateLimit = h => h.response( {
	code: 3,
	message: "Slow down th enumber of requests.",
} );
