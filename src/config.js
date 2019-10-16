
const env = process.env.NODE_ENV;

const config = env === "production" ?
	{
		port: 80,
		cors: [ "http://katma.io" ],
		cryptoMemLimitFactor: 1,
	} :
	{
		port: 8080,
		cors: [ "http://localhost:8081" ],
		cryptoMemLimitFactor: 1 / 16,
	};

export default config;
