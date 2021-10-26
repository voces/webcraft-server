import { readFile, writeFile } from "fs/promises";

(async () => {
	// This package isn't compatible with esbuild
	const path = "node_modules/@hapi/mimos/lib/index.js";
	const contents = await readFile(path, "utf-8");
	writeFile(path, contents.replace("mime-db/db.json", "mime-db"));
})();
