/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from './src/lib/db';

async function migrate() {
    try {
        console.log('Adding reset_token and reset_token_expiry to users table...');
        await executeQuery(`
            ALTER TABLE users 
            ADD COLUMN reset_token VARCHAR(255) NULL, 
            ADD COLUMN reset_token_expiry DATETIME NULL;
        `);
        console.log('Migration successful!');
    } catch (error: any) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        process.exit();
    }
}

migrate();
