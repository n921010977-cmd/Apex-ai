-- ─── VAULT ITEMS ──────────────────────────────────────────────────────────────
-- Server-side persistence for the Knowledge Vault (previously localStorage-only).
CREATE TABLE IF NOT EXISTS vault_items (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'doc',   -- doc | note | memory | project | report
  title      TEXT        NOT NULL DEFAULT 'Без названия',
  content    TEXT        NOT NULL DEFAULT '',
  source     TEXT        NOT NULL DEFAULT 'Добавлено вручную',
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vault_user ON vault_items(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_tags ON vault_items USING GIN(tags);

-- ─── WEBAUTHN / PASSKEYS ──────────────────────────────────────────────────────
-- One row per registered passkey (device biometric / security key). The public
-- key and metadata are non-secret — passkeys have no server-held secret to leak.
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id             TEXT        PRIMARY KEY,          -- base64url credential ID
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key     TEXT        NOT NULL,             -- base64url COSE public key
  counter        BIGINT      NOT NULL DEFAULT 0,   -- signature counter (clone detection)
  transports     TEXT[]      NOT NULL DEFAULT '{}',
  device_label   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);

-- Transient challenge storage for the WebAuthn ceremony (short-lived, one-shot).
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT,                                 -- for login before user is known
  challenge  TEXT        NOT NULL,
  kind       TEXT        NOT NULL,                 -- 'register' | 'authenticate'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenge_email ON webauthn_challenges(email);
