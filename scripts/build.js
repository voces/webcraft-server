import { spawn } from "child_process";
import esbuild from "esbuild";

const watching = process.argv.includes("--watch");

let childProcess;
let killing = false;
const spawnProcess = () => {
	childProcess = spawn("node", ["--enable-source-maps", "dist/index.js"], {
		stdio: "inherit",
	});
	childProcess.on("exit", () => {
		if (!killing) {
			console.log("unexpected exit, restarting...");
			killing = false;
		}
		spawnProcess();
	});
};

const onBuild = () => {
	if (!watching) return;
	if (childProcess) {
		console.log("new build, restarting...");
		killing = true;
		childProcess.kill();
	} else spawnProcess();
};

esbuild
	.build({
		entryPoints: ["src/index.ts"],
		outfile: "dist/index.js",
		bundle: true,
		sourcemap: true,
		platform: "node",
		format: "esm",
		external: [
			"chalk",
			"joi",
			"jsonwebtoken",
			"mime-types",
			"mysql2",
			"node-fetch",
			"tar",
			"ws",
			"vm2",
		],
		watch: watching && {
			onRebuild(error, result) {
				if (error) {
					console.error(error);
					return;
				}
				result?.warnings.forEach((warning) => console.warn(warning));
				onBuild();
			},
		},
	})
	.then(onBuild);
