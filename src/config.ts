const env = process.env.NODE_ENV;

const config =
	env === "production"
		? {
				name: "production",
				port: 3627,
				cors: ["http://katma.io"],
		  }
		: {
				name: "local",
				port: 8080,
				cors: ["http://localhost:8081"],
		  };

export default config;
