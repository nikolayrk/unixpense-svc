import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from 'swagger-ui-express';
import { swaggerComponents as gmailTransactionsComponents } from "./gmailTransactionsRoutes";
import { cardOperationTransaction, standardTransferTransaction } from "../schemas/transaction";

const router = express.Router();

const options = {
    definition: {
      openapi: '3.0.0',
      servers: [
        { url: `${process.env.UNIXPENSE_HOST_PREFIX ?? ''}/api` }
      ],
      info: {
        title: 'Unixpense Tracker API',
        version: '1.0.0',
      },
      components: {
        schemas: {
          cardOperationTransaction,
          standardTransferTransaction
        },
        ...gmailTransactionsComponents
      }
    },
    apis: [ './**/web/routes/*.{js,ts}' ],
  };

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router }
