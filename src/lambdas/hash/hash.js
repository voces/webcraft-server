
import argon2 from "argon2";

export const handler = async str =>
	await argon2.hash( str, {
		memoryCost: 65536,
		timeCost: 3,
		type: argon2.argon2id,
	} );
