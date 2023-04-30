import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from 'swagger-ui-express';
import { swaggerComponents as gmailTransactionsComponents } from "./gmailTransactionsRoutes";

const router = express.Router();

const options = {
    definition: {
      openapi: '3.0.0',
      basePath: "/api",
      info: {
        title: 'Unixpense Tracker API',
        version: '1.0.0',
      },
      components: {
        ...gmailTransactionsComponents
      }
    },
    apis: [ './**/web/routes/*.{js,ts}' ],
  };

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router }
