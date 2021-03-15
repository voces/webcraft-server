import Joi from "joi";

import { ValidationError } from "../errors";
import { EmptyObject, ValidateContext } from "./router";

export const joiValidation = <Params extends EmptyObject>(
	schema: Joi.AnySchema,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => (context: ValidateContext<Params>): any => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const obj: { params?: Params; body?: any } = {};

	if (context.params && Object.keys(context.params).length > 0)
		obj.params = context.params;

	if (context.request.json) obj.body = context.request.json;

	const result = schema.validate(obj);

	if (result.error) throw new ValidationError(result.error.message);

	if (result.value) return result.value;
};
