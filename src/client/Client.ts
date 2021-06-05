import { Client, GuildChannel, UserResolvable } from "discord.js"
import dotenv from "dotenv"
import Database from "./Database"
import Util from "./Util"
import { resolve as resolvePath } from "path"

class UndoBot extends Client {
  util = new Util(this)
  db = new Database(this)

  constructor() {
    super({
      messageCacheMaxSize: 0,
      messageEditHistoryMaxSize: 0,
      allowedMentions: {
        parse: ["users"]
      },
      ws: {
        intents: [
          "GUILDS",
          // "GUILD_BANS",
          "GUILD_EMOJIS",
          // "GUILD_INVITES",
          "GUILD_MEMBERS",
          // "GUILD_WEBHOOKS"
          "GUILD_MESSAGES",
        ]
      }
    })
  }

  async init() {
    dotenv.config({ path: resolvePath(__dirname, "../../.env") })

    Object.defineProperty(GuildChannel.prototype, "hasPermission", {
      value: function hasPermission(this: any, permission: number | string | Array<number | string> = 2048, user: UserResolvable = this.client.user) {
        if (permission === "READ_MESSAGES") permission = ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
        else if (Array.isArray(permission) && permission.includes("READ_MESSAGES"))
          permission = permission.trim("READ_MESSAGES").concat([66560]) // view channel and read message history

        const member = this.guild.members.resolve(user)
        if (permission === "OWNER") return !!member?.user.owner
        const perms = (member && this.memberPermissions(member)) || false
        return perms && perms.has(permission)
      },
      writable: true,
      configurable: true,
    })
    
    await this.login(process.env.TOKEN).then(() => console.log(`Logged in as ${this.user!.tag}!`))
  }
}

export default UndoBot