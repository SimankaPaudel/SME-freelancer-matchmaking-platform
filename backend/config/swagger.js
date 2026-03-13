const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FYP API",
      version: "1.0.0",
      description: "API documentation for Continental Bhanchaa backend",
    },
    servers: [
      {
        url: "http://localhost:5000", // update this if deployed
      },
    ],
  },
  apis: ["./controllers/*.js"], // swagger will read your route comments here
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;