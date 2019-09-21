"use strict";

module.exports = async (event, context) => {
  const { Validate, Employee } = context.models;

  const validationStatus = await Validate(Employee, event.body);

  if (validationStatus.status === "success") {
    const r = await Employee.query().insert(body);
    const body = r;
    const status = 200;

    context.status(status).succeed(body);
  } else {
    const body = validationStatus.response.body;
    const status = validationStatus.response.status;
    context.status(status).fail(body);
  }
};
