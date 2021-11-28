import { URL } from "url";
import { Worker } from "worker_threads";

const worker = new Worker(new URL("passwordsWorker.js", import.meta.url));
worker.addListener("error", (err) => {
	if (err.message.match(/Cannot find module/)) {
		console.error(
			"passwordsWorker.js not found; try building it with `npm run build-passwords-worker`",
		);
		process.exit(1);
	}
	console.error(err);
	process.exit(1);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jobs: ((data: any) => void)[] = [];
let jobId = 0;

worker.on("message", ({ id, result }) => {
	jobs[id](result);
	delete jobs[id];
});

export const hash = (password: string): Promise<string> => {
	const id = jobId++;
	worker.postMessage({
		func: "hash",
		id,
		args: [password],
	});

	return new Promise((resolve) => (jobs[id] = resolve));
};

export const verify = async (
	hash: string,
	password: string,
): Promise<boolean> => {
	const id = jobId++;
	worker.postMessage({
		func: "verify",
		id,
		args: [hash, password],
	});

	return new Promise((resolve) => (jobs[id] = resolve));
};
