// knex requires this file to exist in order to let you do migrations, etc
// Update with your config settings.
const fs = require("fs");
const mysqlHostFile = "/var/openfaas/secrets/mysql-host";
const mysqlDatabaseFile = "/var/openfaas/secrets/mysql-database";
const mysqlPasswordFile = "/var/openfaas/secrets/mysql-password";
const mysqlPortFile = "/var/openfaas/secrets/mysql-port";
const mysqlUserFile = "/var/openfaas/secrets/mysql-user";
const encoding = "utf-8";

function getVars() {
  let host, port, user, password, database;
  try {
    host = fs.readFileSync(mysqlHostFile, encoding);
    database = fs.readFileSync(mysqlDatabaseFile, encoding);
    password = fs.readFileSync(mysqlPasswordFile, encoding);
    port = fs.readFileSync(mysqlPortFile, encoding);
    user = fs.readFileSync(mysqlUserFile, encoding);
  } catch (e) {
    host = process.env.MYSQL_HOST || "localhost";
    database = process.env.MYSQL_DB || "database";
    password = process.env.MYSQL_PW || "password";
    port = process.env.MYSQL_PORT || "3306";
    user = process.env.MYSQL_USER || "root";
  }
  return {
    client: "mysql",
    connection: {
      host: host,
      port: port,
      user: user,
      password: password,
      database: database
    }
  };
}

module.exports = { getVars };
