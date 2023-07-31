import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from 'swagger-ui-express';
import { cardOperationTransaction, standardTransferTransaction } from "../schemas/transaction";
import GoogleOAuth2Constants from "../../constants";

const router = express.Router();

const scopes: {
    [key in typeof GoogleOAuth2Constants.scopes[number]]: string;
} = {
    'https://www.googleapis.com/auth/userinfo.profile': 'See your personal info, including any personal info you\'ve made publicly available',
    'https://www.googleapis.com/auth/userinfo.email': 'See your primary Google Account email address',
    'https://www.googleapis.com/auth/gmail.readonly': 'View your email messages and settings',
};

const googleOAuth2SecurityScheme = {
    Google: {
        type: 'oauth2',
        flows: {
            authorizationCode: {
                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline',
                tokenUrl: GoogleOAuth2Constants.defaultRedirectUri,
                scopes: scopes
            }
        }
    }
};

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
        securitySchemes: {
          ...googleOAuth2SecurityScheme
        },
        schemas: {
          cardOperationTransaction,
          standardTransferTransaction
        }
      }
    },
    apis: [ './**/web/routes/*.{js,ts}' ],
  };

const swaggerSpec = swaggerJSDoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { router }
