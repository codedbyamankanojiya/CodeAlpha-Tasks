const { Sequelize } = require('sequelize');
const { Client } = require('pg');

const getDbCredentials = () => {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/apexbazaar';
  
  try {
    const parsed = new URL(connectionString);
    return {
      user: parsed.username || 'postgres',
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      host: parsed.hostname || 'localhost',
      port: parsed.port || 5432,
      database: parsed.pathname ? parsed.pathname.substring(1) : 'apexbazaar',
      originalUrl: connectionString
    };
  } catch (e) {
    return {
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'apexbazaar',
      originalUrl: connectionString
    };
  }
};

const creds = getDbCredentials();

const ensureDatabaseExists = async () => {
  // Connect to default 'postgres' database to check and create the target db
  const client = new Client({
    user: creds.user,
    password: creds.password,
    host: creds.host,
    port: creds.port,
    database: 'postgres' // connect to default admin db
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [creds.database]);
    
    if (res.rowCount === 0) {
      console.log(`⚠️ Database "${creds.database}" not found. Creating it...`);
      // CREATE DATABASE cannot be executed in a transaction, and must run on pg connection
      await client.query(`CREATE DATABASE "${creds.database}"`);
      console.log(`✔ Database "${creds.database}" created successfully.`);
    }
  } catch (error) {
    console.error(`✘ Error checking/creating database: ${error.message}`);
    // We don't crash here, we let Sequelize try anyway in case it's a permissions issue
  } finally {
    await client.end();
  }
};

const sequelize = new Sequelize(creds.originalUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true // converts camelCase to snake_case in tables
  }
});

const connectDB = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log(`✔ PostgreSQL connected to: ${creds.host}:${creds.port} — DB: "${creds.database}"`);
  } catch (error) {
    console.error(`✘ PostgreSQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
