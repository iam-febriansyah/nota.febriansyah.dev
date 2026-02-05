// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { executeQuery } from './src/lib/db';
// import bcrypt from 'bcryptjs';

// async function createSuperadmin() {
//     try {
//         const name = 'Admin SINFONI';
//         const email = 'admin@sinfoni.com';
//         const password = 'admin123';
//         const role = 'Superadmin';

//         console.log('Generating hash for password...');
//         const hashedPassword = await bcrypt.hash(password, 10);

//         console.log('Inserting superadmin user into database...');
//         await executeQuery(
//             'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
//             [name, email, hashedPassword, role, true]
//         );

//         console.log('Superadmin user created successfully!');
//     } catch (error: any) {
//         if (error.code === 'ER_DUP_ENTRY') {
//             console.log('Superadmin user already exists.');
//         } else {
//             console.error('Failed to create superadmin:', error);
//         }
//     } finally {
//         process.exit();
//     }
// }

// createSuperadmin();
