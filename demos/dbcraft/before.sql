-- OpsBoard schema — before (generic AI schema)
-- The tells: nullable-everything, no key, varchar(255) habit, float money,
-- tz-less timestamps, FKs without ON DELETE, boolean sprawl, json sprawl.

CREATE TABLE users (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  address VARCHAR(255),
  phone VARCHAR(255),
  balance FLOAT,
  status VARCHAR(20),
  is_active BOOLEAN,
  is_verified BOOLEAN,
  is_admin BOOLEAN,
  created_at TIMESTAMP,
  deleted_at DATETIME,
  meta JSON,
  extra JSON,
  blob JSON
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  total DOUBLE PRECISION,
  updated_at TIMESTAMP WITHOUT TIME ZONE
);
