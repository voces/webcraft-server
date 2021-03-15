import RateLimiter from "../RateLimiter";

export const rateLimiter = new RateLimiter({
	recovery: 3,
	latency: 100,
	cap: 10,
});

setInterval(() => rateLimiter.tick(), 100);
