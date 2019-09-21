"use strict";

module.exports = async (event, context) => {
  const knex = context.db.knex();
  const { page, perPage, sort, sortDirection } = {
    ...event.body
  };

  let r;
  if (sort && sortDirection) {
    r = await knex
      .select("employees.*", "states.abbreviation as state_abbreviation")
      .from("employees")
      .leftJoin("states", "employees.state_id", "states.id")
      .orderBy(sort, sortDirection)
      .paginate(page, perPage);
  } else {
    r = await knex
      .select("employees.*", "states.abbreviation as state_abbreviation")
      .from("employees")
      .leftJoin("states", "employees.state_id", "states.id")
      .paginate(page, perPage);
  }

  const body = r;
  const status = 200;
  context.status(status).succeed(body);
};
