const { spawn } = require("child_process");

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
	if (childProcess) {
		console.log("new build, restarting...");
		killing = true;
		childProcess.kill();
	} else spawnProcess();
};

require("esbuild")
	.build({
		entryPoints: ["src/index.ts"],
		outfile: "dist/index.js",
		bundle: true,
		sourcemap: true,
		platform: "node",
		watch: {
			onRebuild(error, result) {
				if (error) {
					console.error(error);
					return;
				}
				result.warnings.forEach((warning) => console.warn(warning));
				onBuild();
			},
		},
	})
	.then(onBuild);
