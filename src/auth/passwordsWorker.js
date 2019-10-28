
import { parentPort } from "worker_threads";
import libsodium from "libsodium-wrappers";

const funcs = {
	hash: async password => {

		await libsodium.ready;

		return libsodium.crypto_pwhash_str(
			password,
			libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
			libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE
		);

	},
	verify: async ( hash, password ) => {

		await libsodium.ready;

		return libsodium.crypto_pwhash_str_verify(
			hash,
			password,
		);

	},
};

parentPort.on( "message", async ( { func, id, args } ) => {

	const result = await funcs[ func ]( ...args );

	parentPort.postMessage( {
		id,
		result,
	} );

} );
