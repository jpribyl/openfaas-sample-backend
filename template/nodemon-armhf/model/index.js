const db = require("../db/dbconfig.js");
const { Model } = require("objection");

const knex = db.knex();

// Give the knex instance to objection.
Model.knex(knex);

module.exports = Model;
