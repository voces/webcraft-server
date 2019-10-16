
import { query } from "../mysql.js";

const deleteAccounts = async () => {

	await query( `
        INSERT INTO users_deleted SELECT *, "inactive" reason FROM users WHERE logged_in_at < NOW() - INTERVAL 3 MONTH;
        DELETE FROM users WHERE logged_in_at < NOW() - INTERVAL 3 MONTH;
    ` ).then( console.log ).catch( console.error );

};

deleteAccounts();

// run once a day
setInterval( deleteAccounts, 1000 * 60 * 60 * 24 );
