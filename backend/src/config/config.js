import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: Number(process.env.PORT) ?? 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    masterKey2fa: Buffer.from(process.env.MASTER_KEY_2FA ?? '', 'hex'),
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtCookie: process.env.JWT_COOKIE ?? 'TODO_APP_JWT',
    refreshCookie: process.env.JWT_COOKIE ?? 'TODO_APP_REFRESH',
    dbHost: process.env.DB_HOST ?? '',
    dbPort: Number.parseInt(process.env.DB_PORT ?? '5432'),
    dbDatabase: process.env.DB_NAME ?? '',
    dbUser: process.env.DB_USER ?? '',
    dbPassword: process.env.DB_PASSWORD ?? '',
};

if (config.masterKey2fa.length != 32) {
    throw new Error('master key not set or not 32 bytes (64 hex characters)');
}

if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET not set or too short');
}

if (!config.dbHost || !config.dbDatabase || !config.dbUser || !config.dbPassword) {
    throw new Error('Invalid DB configuration.');
}

export default config;
