import pg from 'pg';
import config from '../config/config.js';

export const pool = new pg.Pool({
    host: config.dbHost.split(":")[0],
    database: config.dbDatabase,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    // ssl: { rejectUnauthorized: false }
});
