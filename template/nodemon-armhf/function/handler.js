"use strict";
const db = require("./db/dbconfig.js");

module.exports = async (event, context) => {
  let err;
  const body = event.body;

  const knex = db.knex();
  r = await knex
    .select()
    .from("table")
    .paginate(page, perPage);

  const result = {
    body: r
  };

  context.status(200).succeed(result);
};
