const swaggerJSDoc = require("swagger-jsdoc");

const swaggerApiUrl = process.env.SWAGGER_API_URL || "http://localhost:5000";

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
        url: swaggerApiUrl,
        description: process.env.NODE_ENV === 'production' ? 'Production API' : 'Development API'
      },
    ],
  },
  apis: ["./controllers/*.js"], // swagger will read your route comments here
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;