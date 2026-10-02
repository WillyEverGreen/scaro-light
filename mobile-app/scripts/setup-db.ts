import pg from 'pg';
import { stripIndent } from 'common-tags'; // Assuming this might not be available, I'll use template literals directly

const { Client } = pg;

async function tryConnect(password: string): Promise<pg.Client | null> {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: password,
        port: 5432,
    });

    try {
        await client.connect();
        return client;
    } catch (e) {
        return null;
    }
}

async function setup() {
    console.log('Attempting to connect to local PostgreSQL...');

    // Try common default passwords
    const passwords = ['postgres', 'password', 'admin', 'root', ''];
    let client: pg.Client | null = null;
    let usedPassword = '';

    for (const pw of passwords) {
        console.log(`Trying password: "${pw}"...`);
        client = await tryConnect(pw);
        if (client) {
            usedPassword = pw;
            console.log('Connected successfully!');
            break;
        }
    }

    if (!client) {
        console.error('Could not connect to PostgreSQL with default credentials.');
        console.error('Please ensure PostgreSQL is running and accepting connections on localhost:5432.');
        process.exit(1);
    }

    try {
        // 1. Create Role
        const roleCheck = await client.query("SELECT 1 FROM pg_roles WHERE rolname='edgecase_user'");
        if (roleCheck.rowCount === 0) {
            console.log('Creating role edgecase_user...');
            await client.query("CREATE ROLE edgecase_user LOGIN PASSWORD 'edgecase_password' CREATEDB");
        } else {
            console.log('Role scaro_user already exists.');
        }

        // 2. Create Database
        // Note: CREATE DATABASE cannot be run in a transaction block, and pg client often doesn't like it in simple query if auto-transaction?
        // Actually, pg node client sends queries directly.
        const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname='supply_chain_db'");
        if (dbCheck.rowCount === 0) {
            console.log('Creating database supply_chain_db...');
            await client.query('CREATE DATABASE supply_chain_db OWNER scaro_user');
        } else {
            console.log('Database supply_chain_db already exists.');
        }

        console.log('\n✅ Database setup complete!');
        console.log(`Connection string: postgres://scaro_user:scaro_password@localhost:5432/supply_chain_db`);

    } catch (e) {
        console.error('Error during setup:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

setup();
