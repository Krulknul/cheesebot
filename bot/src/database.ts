import Database from 'better-sqlite3';

export interface DatabaseBackupService {
    backup: (buffer: Buffer) => Promise<void>;
}

export class DatabaseService {
    db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
    }

    async get(key: string): Promise<string | null> {
        const stmt = this.db.prepare('SELECT value FROM kvs WHERE key = ?');
        const row: any = stmt.get(key);
        return row ? row.value : null;
    }

    async set(key: string, value: string) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO kvs (key, value) VALUES (?, ?)');
        stmt.run(key, value);
    }
}
