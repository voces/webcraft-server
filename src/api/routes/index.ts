import { register } from "../router";
import { error } from "./error";

export const registerApiRoutes = (): void => {
	register(error);
};
