# 4. Integer Identity Primary and Foreign Keys

DOMORA uses standard 32-bit SQL-standard auto-incrementing integer identifiers (`integer("id").primaryKey().generatedByDefaultAsIdentity()`) for all relational database tables and foreign key relationships, replacing the earlier UUID string identifiers.

We decided to use pure integer primary keys directly across internal relations, server queries, domain models, and external route segments (relying on server-side session authorization rather than obscure random tokens for record protection). This provides compact B-tree indexes, eliminated UUID storage/join overhead, direct compatibility with TypeScript `number` primitives without BigInt serialization boundaries, and predictable deterministic identifiers for development seeds and test fixtures. Cryptographic tokens (such as session tokens and password hashes) remain separate dedicated `text` columns.
