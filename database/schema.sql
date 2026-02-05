CREATE DATABASE IF NOT EXISTS sinfoni;
USE sinfoni;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Superadmin', 'Dealer', 'Finance') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealers table
CREATE TABLE IF NOT EXISTS dealers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Barang table
CREATE TABLE IF NOT EXISTS mst_barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Barang Price table (History)
CREATE TABLE IF NOT EXISTS mst_barang_price (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barang_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    effective_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barang_id) REFERENCES mst_barang(id) ON DELETE CASCADE
);

-- Transaction Header table
CREATE TABLE IF NOT EXISTS trx_header (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    dealer_id INT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2) DEFAULT 0,
    promo_description TEXT DEFAULT NULL,
    status ENUM('Pending', 'Proses', 'Done', 'Reject') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dealer_id) REFERENCES dealers(id)
);

-- Transaction Items table
CREATE TABLE IF NOT EXISTS trx_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    header_id INT NOT NULL,
    barang_id INT NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (header_id) REFERENCES trx_header(id) ON DELETE CASCADE,
    FOREIGN KEY (barang_id) REFERENCES mst_barang(id)
);

-- Transaction Status Log table
CREATE TABLE IF NOT EXISTS trx_status_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trx_header_id INT NOT NULL,
    status ENUM('Pending', 'Proses', 'Done', 'Reject') NOT NULL,
    notes TEXT,
    updated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trx_header_id) REFERENCES trx_header(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Initial Data (Optional for testing)
-- Superadmin: admin@sinfoni.com / admin123 (hashed password will be needed later)
-- INSERT INTO users (name, email, password, role) VALUES ('Admin SINFONI', 'admin@sinfoni.com', '$2b$10$YourHashedPasswordHere', 'Superadmin');
