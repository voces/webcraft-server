import Hapi from "@hapi/hapi";

export type HapiPayload<Payload, Request = Hapi.Request> = Request & {
	payload: Payload;
};
