#!/usr/bin/env node

import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration interface
interface DatabaseConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    ssl: boolean | { rejectUnauthorized: boolean };
}

// Database configuration
const dbConfig: DatabaseConfig = {
    user: process.env.DB_USER || 'your_db_user',
    host: process.env.DB_HOST || 'your_rds_endpoint',
    database: process.env.DB_NAME || 'your_db_name',
    password: process.env.DB_PASSWORD || 'your_db_password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Interface for table structure query result
interface TableStructure {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
}

async function runMigration(): Promise<void> {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('Connecting to PostgreSQL database...');
        const client: PoolClient = await pool.connect();
        
        console.log('Connected successfully!');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '001_create_favorites_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration: 001_create_favorites_table.sql');
        
        // Execute the migration
        await client.query(migrationSQL);
        
        console.log('Migration completed successfully!');
        
        // Verify the table was created
        const tableCheck: QueryResult<TableStructure> = await client.query(`
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'favorites'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nTable structure:');
        console.table(tableCheck.rows);
        
        client.release();
        
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Check if required environment variables are set
const requiredEnvVars: string[] = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars: string[] = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('Please set the following environment variables:');
    missingVars.forEach(varName => {
        console.log(`  ${varName}=your_${varName.toLowerCase()}`);
    });
    console.log('\nExample usage:');
    console.log('DB_HOST=your-rds-endpoint.amazonaws.com DB_USER=postgres DB_PASSWORD=yourpassword DB_NAME=imagegen npm run migrate');
    process.exit(1);
}

runMigration(); 