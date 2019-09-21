"use strict";
let knex = require("knex");
const knexfile = require("./knexfile.js");

//monkey patch pagination into knex
let KnexQueryBuilder = require("knex/lib/query/builder");
KnexQueryBuilder.prototype.paginate = function(current_page, per_page) {
  let pagination = {};
  //set defaults
  per_page = per_page || 10;
  let page = current_page || 1;
  //account for silly values
  if (page < 1) page = 1;

  let offset = (page - 1) * per_page;
  return Promise.all([
    //could make this id for performance as long as all tables have an id column
    this.clone()
      .count("* as count")
      .first(),
    this.offset(offset).limit(per_page)
  ]).then(([total, rows]) => {
    let count = total.count;
    rows = rows;
    pagination.total = count;
    pagination.per_page = per_page;
    pagination.last_page = Math.ceil(count / per_page);
    pagination.current_page = page;
    pagination.data = rows;
    return pagination;
  });
};

function connectKnex() {
  const vars = knexfile.getVars();
  return knex({
    client: vars.client,
    connection: vars.connection,
    pool: { min: 0, max: 7 }
  });
}

module.exports = {
  knex: connectKnex
};
