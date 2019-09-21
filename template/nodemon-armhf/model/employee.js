const Model = require("./index.js");

// Employee model.
class Employee extends Model {
  static get tableName() {
    return "employees";
  }

  static get uniqueKeys() {
    return ["email"];
  }

  // used for input validation
  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "first_name",
        "last_name",
        "email",
        "phone",
        "state_id",
        "street_address",
        "city",
        "zip_code"
      ],

      properties: {
        id: { type: "integer" },
        state_id: { type: "integer" },
        first_name: { type: "string", minLength: 1, maxLength: 100 },
        last_name: { type: "string", minLength: 1, maxLength: 100 },
        email: { type: "string", minLength: 1, maxLength: 100 },
        phone: { type: "string", minLength: 1, maxLength: 20 },
        street_address: { type: "string", minLength: 0, maxLength: 50 },
        city: { type: "string", minLength: 0, maxLength: 25 },
        zip_code: { type: "string", minLength: 0, maxLength: 10 },
        status: { type: "string", minLength: 0, maxLength: 20 }
      }
    };
  }
}

module.exports = Employee;
