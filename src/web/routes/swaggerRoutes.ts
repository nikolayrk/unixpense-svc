import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from 'swagger-ui-express';

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
        securitySchemes: {
          Google: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline',
                tokenUrl: `${process.env.UNIXPENSE_URI}/api/transactions/gmail/oauthcallback`,
                scopes: {
                  'https://www.googleapis.com/auth/gmail.readonly': 'Read-only access to Gmail message data',
                }
              }
            }
          }
        }
      }
    },
    apis: [ './src/web/routes/*.{js,ts}' ],
  };

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router }
