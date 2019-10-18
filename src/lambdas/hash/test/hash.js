
import argon2 from "argon2";

( ( async () => {

	const start = Date.now();
	const hash = await argon2.hash( "password", { memoryCost: 65536, timeCost: 2, type: argon2.argon2id } );
	console.log( Date.now() - start );

	console.log( hash );

} ) )();

// $argon2id$v=19$m=65536,t=2,p=1$AMznwDmR57YYJtUv1F4qNQ$QXaBouZObhv9gkoDew31ObepYGU9Kvy9Qnlo/ipxa50
// $argon2i$v=19$m=65536,t=2,p=1$YfNhLzoK1j2cYD9r+Swq2w$Ez4C4JK1yYjyjbRrFxiuSbiO763Ef7XZQbWFh44+0k8
