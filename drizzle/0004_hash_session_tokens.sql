-- Store sha256 digests instead of raw tokens; hashing in place keeps existing
-- logins valid because the cookie still carries the raw token.
UPDATE "sessions" SET "token" = encode(sha256(convert_to("token", 'UTF8')), 'hex');
