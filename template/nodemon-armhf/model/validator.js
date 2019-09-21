const db = require("../db/dbconfig.js");
const knex = db.knex();

module.exports = async function Validate(model, body) {
  const uniqueKeys = model.uniqueKeys || [];

  //validate model
  try {
    model.fromJson(body);
  } catch (e) {
    console.log(e);
    return {
      status: "fail",
      response: {
        status: 400,
        body: "error: " + e
      }
    };
  }

  for (var i = 0, len = uniqueKeys.length; i < len; i++) {
    var obj = {};
    const key = uniqueKeys[i];
    obj[key] = body[key];

    const s = await knex(model.tableName).where({ ...obj });
    if (s.length !== 0) {
      return {
        status: "fail",
        response: {
          status: 400,
          body: "error: " + key + "Must Be Unique"
        }
      };
    }
  }

  return {
    status: "success"
  };
};
