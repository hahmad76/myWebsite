-- SSHP production database schema
-- Order request text is intentionally stored in orders.request_text.
-- Existing production installations should run the migration in order-request-text.sql.

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  quote_id VARCHAR(64) NULL,
  customer_name VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(190) NULL,
  service VARCHAR(190) NOT NULL,
  request_text TEXT NULL,
  amount_minor BIGINT NULL,
  currency CHAR(3) DEFAULT 'PKR',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_orders_created(created_at),
  INDEX idx_orders_customer(customer_name,phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
