import type { HandlerContext } from "./api/router";
import {
	hasBoolean,
	hasMaybeNumber,
	hasMaybeString,
	hasNumber,
	hasString,
	isRecord,
} from "./typeguards";

export interface ApiError {
	apiError: true;
	code: number;
	message: string;
	field?: string;
	statusCode?: number;
}

interface SimpleContext {
	response: HandlerContext["response"];
}

export const usernameTaken = ({ response }: SimpleContext): ApiError => {
	response.statusCode = 400;
	return {
		apiError: true,
		code: 0,
		message: "Username taken.",
		field: "username",
	};
};

export const incorrectPassword = ({ response }: SimpleContext): ApiError => {
	response.statusCode = 400;
	return {
		apiError: true,
		code: 1,
		message: "Incorrect password.",
		field: "password",
	};
};

export const unknownUsername = ({ response }: SimpleContext): ApiError => {
	response.statusCode = 400;
	return {
		apiError: true,
		code: 2,
		message: "Account does not exist.",
		field: "username",
	};
};

export const rateLimit = ({ response }: SimpleContext): ApiError => {
	response.statusCode = 400;
	return {
		apiError: true,
		code: 3,
		message: "Slow down the number of requests.",
	};
};

export const jsonError = ({ response }: SimpleContext): ApiError => {
	response.statusCode = 400;
	return {
		apiError: true,
		code: 4,
		message: "Body is not valid json!",
	};
};

export class Missing404Error extends Error {
	apiError = true;
	statusCode = 404;
	message = "Requested route is missing";
	code = 5;
}

export class MissingBodyError extends Error {
	apiError = true;
	statusCode = 400;
	message = "JSON body is expected on POST requests";
	code = 6;
}

export class ValidationError extends Error {
	apiError = true;
	statusCode = 400;
	code = 7;
	message!: string;

	toJSON(): unknown {
		return {
			statusCode: this.statusCode,
			code: this.code,
			message: this.message,
		};
	}
}

export class UncaughtError extends Error {
	apiError = true;
	statusCode = 500;
	message = "An uncaught server error was thrown";
	code = 8;
}

export const isError = (value: unknown): value is { message: string } =>
	isRecord(value) && hasString(value, "message");

export const isApiError = (value: unknown): value is ApiError =>
	isRecord(value) &&
	hasBoolean(value, "apiError") &&
	hasNumber(value, "code") &&
	hasMaybeString(value, "field") &&
	hasMaybeNumber(value, "statusCode");
