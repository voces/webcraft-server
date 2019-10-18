
import libsodium from "libsodium-wrappers";

export const hash = async password => {

	await libsodium.ready;

	return libsodium.crypto_pwhash_str(
		password,
		libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
		libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
	);

};

export const verify = async ( hash, password ) => {

	await libsodium.ready;

	return libsodium.crypto_pwhash_str_verify(
		hash,
		password,
	);

};
