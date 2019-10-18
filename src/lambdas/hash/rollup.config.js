
import { terser } from "rollup-plugin-terser";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = ! process.env.ROLLUP_WATCH;

export default {
	input: "hash.js",
	output: {
		file: "dist/bundle.js",
		format: "cjs",
		sourcemap: true,
		indent: true,
	},
	external: [ "argon2" ],
	plugins: [
		production && terser(), // minify, but only in production
	],
};
