export const isRecord = (
	value: unknown,
): value is Record<string | number | symbol, unknown> =>
	!!value && typeof value === "object";

export const hasString = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: string } => k in v && typeof v[k] === "string";

export const hasMaybeString = <
	T extends Record<string, unknown>,
	K extends string,
>(
	v: T,
	k: K,
): v is T & { [k in K]: string | undefined } =>
	k in v
		? typeof v[k] === "string" || v[k] === null || v[k] === undefined
		: true;

export const hasBoolean = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: boolean } => k in v && typeof v[k] === "boolean";

export const hasNumber = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: number } => k in v && typeof v[k] === "number";

export const hasMaybeNumber = <
	T extends Record<string, unknown>,
	K extends string,
>(
	v: T,
	k: K,
): v is T & { [k in K]: number | undefined } =>
	k in v
		? typeof v[k] === "number" || v[k] === null || v[k] === undefined
		: true;

export const hasRecord = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: Record<string, unknown> } =>
	k in v && !!v[k] && typeof v[k] === "object";
