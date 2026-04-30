import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from '$lib/server/db/schema'

export function getDbFromSqlite(sqlite: import('better-sqlite3').Database): BetterSQLite3Database<typeof schema> {
	return drizzle(sqlite, { schema })
}
