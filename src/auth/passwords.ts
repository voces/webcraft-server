import { Worker } from "worker_threads";
import Path from "path";
import { fileURLToPath } from "url";

const __dirname = Path.dirname(fileURLToPath(import.meta.url));

const worker = new Worker(Path.join(__dirname, "passwordsWorker.js"));

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
