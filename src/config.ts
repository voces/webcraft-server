const env = process.env.NODE_ENV;

const config =
	env === "production"
		? {
				name: "production",
				port: 3627,
				cors: ["https://katma.io"],
		  }
		: {
				name: "local",
				port: 8080,
				cors: ["http://localhost:8081", "http://localhost:8082"],
		  };

export default config;
