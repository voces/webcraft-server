import { register } from "../router";
import {
	authAnonRoute,
	authLoginRoute,
	authRegisterRoute,
} from "./auth/routes";
import { certs } from "./certs";
import { error } from "./error";

export const registerApiRoutes = (): void => {
	register(error);
	register(certs);
	register(authAnonRoute);
	register(authLoginRoute);
	register(authRegisterRoute);
};
