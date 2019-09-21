"use strict";

module.exports = async (event, context) => {
  const body = event.body;
  const { Employee } = context.models;
  try {
    const r = await Employee.query()
      .patch({ status: "active" })
      .where("id", body.id);

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
