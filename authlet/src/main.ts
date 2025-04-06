import { createServer } from './server';
import { createDatabaseConnectionAsync } from '@shared/database';
import GoogleOAuth2Tokens from '@shared/models/googleOAuth2Tokens.model';

const port = process.env.PORT || '3000';
const app = createServer();

async function main() {
    try {
        // Initialize database connection and models
        const sequelize = await createDatabaseConnectionAsync();
        sequelize.addModels([GoogleOAuth2Tokens]);
        
        app.listen(port, () => {
            console.log(`Authlet is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export default app;
