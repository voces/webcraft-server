/**
 * @param {string} url
 * @param {Object} context (currently empty)
 * @param {Function} defaultGetFormat
 * @returns {Promise<{ format: string }>}
 */
export async function getFormat(url, context, defaultGetFormat) {
	if (url.includes("node_modules/three/src"))
		return {
			format: "module",
		};

	return defaultGetFormat(url, context, defaultGetFormat);
}
