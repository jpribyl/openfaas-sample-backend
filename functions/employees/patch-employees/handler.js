"use strict";

module.exports = async (event, context) => {
  const { Employee } = context.models;
  const { id } = event.query;
  try {
    const r = await Employee.query()
      .patch({ status: "active" })
      .where("id", id);

    const status = 200;
    const body = "User activated";
    context.status(status).succeed(body);
  } catch (e) {
    console.log(e);
    const status = 400;
    const body = "error: " + e;
    context.status(status).fail(body);
  }
};
