import express from 'express';
import config from './config/config';
import apiRoutes from './routes/api-routes';
import { errorHandler } from './error-handling';

const app = express();

app.use(express.json());

app.use('/api/', apiRoutes);

app.use(errorHandler);

app.listen(config.port, (error) => {
    if (error) {
        console.error(`Failed to start server: ${error.message}`);
    } else {
        console.log(`Server running on port ${config.port}`);
    }
});
