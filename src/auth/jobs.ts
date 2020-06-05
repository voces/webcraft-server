import { deletedInactiveAccounts } from "../mysql.js";

deletedInactiveAccounts();

// run once a day
setInterval(deletedInactiveAccounts, 1000 * 60 * 60 * 24);
