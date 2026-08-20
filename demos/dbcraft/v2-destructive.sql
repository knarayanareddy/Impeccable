-- The destructive one-step migration: drop the column, retype, remove the FK
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  total DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
