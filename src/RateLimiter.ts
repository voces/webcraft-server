import { LATENCY } from "./wss.js";

const CAP = 50;
const RECOVERY = 10;

export default class RateLimiter {
	last = 0;
	cap: number;
	recovery: number;
	latency: number;
	remaining: number;

	constructor({
		cap,
		recovery,
		latency,
	}: {
		cap?: number;
		recovery?: number;
		latency?: number;
	} = {}) {
		this.cap = cap || CAP;
		this.recovery = recovery || RECOVERY;
		this.latency = latency || LATENCY;
		this.remaining = this.cap;
	}

	test(power = 1): boolean {
		const now = Date.now() / 1000;
		const check = (1 / ((now - this.last) * 5) + 1) * power;
		if (this.remaining > check) {
			this.last = now;
			this.remaining = this.remaining - check;
			return true;
		}

		return false;
	}

	tick(): void {
		this.remaining = Math.min(
			this.cap,
			this.remaining + this.recovery / (1000 / this.latency),
		);
	}
}
