require('dotenv').config()

function getClient()
{
// Connect to postgres db
const pg = require("pg");
const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pgClient.connect();
//require("./setup_table").setup(pgClient);
return pgClient;
}
module.exports.getClient = getClient;