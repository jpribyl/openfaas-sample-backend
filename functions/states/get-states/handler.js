"use strict";

module.exports = async (event, context) => {
  const knex = context.db.knex();
  const r = await knex.select().from("states");
  const body = r;

  context.status(200).succeed(result);
};
