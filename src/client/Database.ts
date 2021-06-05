import Sqlite, { Database as SqliteDatabase } from "better-sqlite3"
import UndoBot from "./Client";
import { resolve as resolvePath } from "path"
import { Collection, GuildResolvable } from "discord.js";

interface GuildSettings {
  guildID: string,
  trigger: string,
  permission: number
}

class Database {
  db: SqliteDatabase = new Sqlite(resolvePath(__dirname, "../../undo.sqlite"))
  cache: Collection<string, GuildSettings> = new Collection()
  constructor(public client: UndoBot) {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        guildID STRING NOT NULL PRIMARY KEY,
        trigger TEXT,
        permission INTEGER
      )
    `).run()
  }

  fetchGuild(guild: GuildResolvable): GuildSettings
  fetchGuild(guild: GuildResolvable, create: false): GuildSettings | null
  fetchGuild(guild: GuildResolvable, create: boolean = true): GuildSettings | null {
    const id = this.client.guilds.resolveID(guild)
    if (!id) return null
    if (this.cache.has(id)) return this.cache.get(id)!
    const settings = this.db.prepare(`SELECT * FROM settings WHERE guildID = ?`).get(id)
    if (settings) {
      this.cache.set(id, settings)
      return settings
    }
    if (create) {
      this.db.prepare(`INSERT INTO settings (guildID, trigger, permission) VALUES (?, 'undo', 32)`).run(id)
      const data = {
        guildID: id,
        trigger: "undo",
        permission: 32
      }
      this.cache.set(id, data)
      return data
    }
    return null
  }

  update(guild: GuildResolvable, data: { trigger?: string, permission?: number }): GuildSettings {
    const id = this.client.guilds.resolveID(guild)!
    this.db.prepare(`UPDATE settings SET ${Object.keys(data).map(k => `${k} = @${k}`)} WHERE guildID = ?`).run(data, id)
    if (!this.cache.has(id)) return this.fetchGuild(id)!
    return Object.assign(this.cache.get(id), data)
  }
}

export default Database