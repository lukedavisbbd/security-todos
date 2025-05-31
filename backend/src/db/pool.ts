import pg from 'pg';
import config from '../config/config';

export const pool = new pg.Pool({
    host: config.dbHost,
    database: config.dbDatabase,
    user: config.dbUser,
    password: config.dbPassword,
});
