-- Real TOTP-based 2FA storage. The secret is encrypted at rest by the
-- application (AES-256-GCM, src/lib/crypto/encryption.ts) before being
-- written here — this column never holds a plaintext secret. Backup codes
-- are stored as bcrypt hashes, one-time-use, removed on redemption.
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS two_fa_secret_enc   TEXT,
  ADD COLUMN IF NOT EXISTS two_fa_backup_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS two_fa_verified_at   TIMESTAMPTZ;
