
import express from 'express';
import * as dotenv from'dotenv';

function bootstrap(): void {
    dotenv.config();

    const app = express();
    const port = process.env.PORT;

    app.get('/', (req, res) => {
        res.send('Express + TypeScript Server');
    });

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();