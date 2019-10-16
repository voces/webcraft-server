
import libsodium from "libsodium-wrappers";
import config from "../config.js";

export const hash = async password => {

	await libsodium.ready;

	return libsodium.crypto_pwhash_str(
		password,
		libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
		libsodium.crypto_pwhash_MEMLIMIT_SENSITIVE * config.cryptoMemLimitFactor
	);

};

export const verify = async ( hash, password ) => {

	await libsodium.ready;

	return libsodium.crypto_pwhash_str_verify(
		hash,
		password,
	);

};
