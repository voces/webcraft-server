import libsodium from "libsodium-wrappers";
import { parentPort } from "worker_threads";

if (!parentPort) throw new Error("not run as a worker");

const funcs = {
	hash: async (password: string) => {
		await libsodium.ready;

		return libsodium.crypto_pwhash_str(
			password,
			libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
			libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
		);
	},
	verify: async (hash: string, password: string) => {
		await libsodium.ready;

		return libsodium.crypto_pwhash_str_verify(hash, password);
	},
};

parentPort.on(
	"message",
	async <Func extends keyof typeof funcs>({
		func,
		id,
		args,
	}: {
		func: Func;
		id: number;
		args: Parameters<typeof funcs[Func]>;
	}) => {
		console.log("password job!");
		// TODO: develop a better typing
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await funcs[func](...(args as [any, any]));

		if (!parentPort) throw new Error("no longer a worker");

		parentPort.postMessage({
			id,
			result,
		});
	},
);
