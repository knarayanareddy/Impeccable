-- OpsBoard schema — after (the dbcraft pass)
-- Same facts, stated as truth: keys, deliberate types, documented nulls,
-- constraints in the schema, explicit deletion policies.

CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  address TEXT, -- null = no address on file (contactless accounts)
  phone VARCHAR(32), -- null = no phone on file
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'pending_deletion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ -- null = not deleted
);
CREATE UNIQUE INDEX users_email_active_idx ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total_cents BIGINT NOT NULL CHECK (total_cents >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_id_idx ON orders (user_id);
