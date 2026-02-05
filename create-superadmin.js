/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function createSuperadmin() {
    // 1. Manually parse .env
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at:', envPath);
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) config[key.trim()] = value.trim();
    });

    let connection;
    try {
        console.log('Connecting to database:', config.DB_HOST);
        connection = await mysql.createConnection({
            host: config.DB_HOST,
            port: config.DB_PORT,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            database: config.DB_NAME,
        });

        const name = 'Admin SINFONI';
        const email = 'admin@sinfoni.com';
        const password = 'admin123';
        
        // pbkdf2 hashing (salt:hash)
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const hashedPassword = `${salt}:${hash}`;
        
        const role = 'Superadmin';

        console.log('Checking if user exists...');
        const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            console.log('User already exists, updating password...');
            await connection.execute(
                'UPDATE users SET password = ?, role = ?, is_active = ? WHERE id = ?',
                [hashedPassword, role, true, rows[0].id]
            );
        } else {
            console.log('Inserting new superadmin user...');
            await connection.execute(
                'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, role, true]
            );
        }

        console.log('Superadmin user created/updated successfully!');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
    } catch (error) {
        console.error('Operation failed:', error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

createSuperadmin();
