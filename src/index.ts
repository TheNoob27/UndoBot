import Client from "./client/Client"
import Undo from "./undo"
import "../functions.js"
import { MessageEmbed } from "discord.js"

// Structures.extend("Guild", G => {
//   class AuditLogManager {
//     data: GuildAuditLogs
//     constructor(public guild: import("discord.js").Guild) {
//       this.data = new GuildAuditLogs(this.guild, { audit_log_entries: [] })
//     }

//     // async update() {
//     //   let audit = await this.guild.fetchAuditLogs({ limit: 100 })
//     //   if (!this.data.entries.size || this.data.entries.has(audit.entries.firstKey()!)) return this.concat(audit)
//     //   const logs = [audit]
//     //   do logs.unshift
//     //   while (!this.data.entries.has(logs[0].entries.firstKey()!) && logs.length < 3)
//     // }

//     // concat(...logs: GuildAuditLogs[]) {
//     //   // tbh idk if i care about users/integrations/webhooks from audit log entries
//     //   logs.flat(2)
//     //   for (const data of logs)
//     //     for (const [id, entry] of data.entries)
//     //       this.data.entries.set(id, entry)
//     //   return this
//     // }
//   }
  
//   return class Guild extends G {}
// })

const client = new Client()
// events in index file ewie
// but i was too lazy to add handlers for a simple bot like this

client.on("ready", () => console.log(`${client.user!.username} is ready!`))

client.on("message", message => {
  if (message.channel.type !== "text") return
  if (!message.channel.hasPermission(["SEND_MESSAGES", "READ_MESSAGES"])) return
  const settings = client.db.fetchGuild(message.guild!)!
  // if (!message.member?.hasPermission(settings.permission)) return
  if (message.member?.id !== message.guild!.ownerID) return
  if (new RegExp(`^<@!?${client.user!.id}>$`).test(message.content))
    return message.channel.send(
      message.guild?.me?.hasPermission("EMBED_LINKS")
      ? new MessageEmbed()
        .setDescription(
          message.guild!.me?.hasPermission("VIEW_AUDIT_LOG")
            ? `Say \`${settings.trigger}\` to undo an action! \`${settings.trigger} help\` for more info.`
            : "Please give me the `View Audit Log` permission to get started."
        )
        .setColor("#5865f2")
      : "Please give me the `Embed Links` permission."
    )
  if (!message.content.toLowerCase().startsWith(settings.trigger.toLowerCase())) return
  const args = message.content.slice(settings.trigger.length).toLowerCase().trim().split(/\s+/)
  if (args.length === 1 && args[0] === "") args.length = 0
  return Undo(message, args)
})

client.on("debug", info => {
  if (info.toLowerCase().includes("heartbeat")) return // ping or whatever, hella spammy, dont care
  if (info.startsWith("429 hit on route")) return console.error(info)
  return console.log(info)
})

client.init()