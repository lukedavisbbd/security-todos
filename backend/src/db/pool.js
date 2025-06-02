import pg from 'pg';
import config from '../config/config.js';

export const pool = new pg.Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: config.dbDatabase,
    user: config.dbUser,
    password: config.dbPassword,
});
