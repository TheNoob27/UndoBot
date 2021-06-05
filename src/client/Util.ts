import { GuildAuditLogs, GuildChannel, Invite, Message, TextChannel, Webhook } from "discord.js";
import { Guild } from "discord.js";
import { Role } from "discord.js";
import { GuildEmoji } from "discord.js";
import { Base } from "discord.js";
import { GuildAuditLogsEntry } from "discord.js";
import { Util as DiscordUtil } from "discord.js"
import UndoBot from "./Client";

interface GuildAuditLogUndoData {
  action: string,
  hasPermission: boolean
  undo(): Promise<{ success: boolean, result?: string }>
  outdated?: boolean
}

class Util {
  get discordUtil() { return DiscordUtil }
  public canUndoList = [
    GuildAuditLogs.Actions.CHANNEL_CREATE!,
    GuildAuditLogs.Actions.CHANNEL_DELETE!, // kinda
    GuildAuditLogs.Actions.CHANNEL_OVERWRITE_CREATE!,
    GuildAuditLogs.Actions.CHANNEL_OVERWRITE_DELETE!,
    GuildAuditLogs.Actions.CHANNEL_OVERWRITE_UPDATE!,
    GuildAuditLogs.Actions.CHANNEL_UPDATE!,
    GuildAuditLogs.Actions.MEMBER_BAN_ADD!,
    GuildAuditLogs.Actions.MEMBER_BAN_REMOVE!,
    GuildAuditLogs.Actions.MEMBER_UPDATE!,
    GuildAuditLogs.Actions.MEMBER_ROLE_UPDATE!,
    GuildAuditLogs.Actions.MEMBER_MOVE!,
    GuildAuditLogs.Actions.BOT_ADD!,
    GuildAuditLogs.Actions.ROLE_CREATE!,
    GuildAuditLogs.Actions.ROLE_UPDATE!,
    GuildAuditLogs.Actions.ROLE_DELETE!,
    GuildAuditLogs.Actions.INVITE_CREATE!,
    GuildAuditLogs.Actions.INVITE_UPDATE!, // doesn't seem to ever occur
    // GuildAuditLogs.Actions.INVITE_DELETE!, // (will) just create an new invite lmao
    GuildAuditLogs.Actions.WEBHOOK_CREATE!,
    GuildAuditLogs.Actions.WEBHOOK_UPDATE!,
    GuildAuditLogs.Actions.WEBHOOK_DELETE!, // although code will be different, let's keep this
    GuildAuditLogs.Actions.EMOJI_CREATE!,
    GuildAuditLogs.Actions.EMOJI_UPDATE!,
    GuildAuditLogs.Actions.EMOJI_DELETE!,
    GuildAuditLogs.Actions.MESSAGE_PIN!,
    GuildAuditLogs.Actions.MESSAGE_UNPIN!,
    // GuildAuditLogs.Actions.INTEGRATION_CREATE!, // what are these 3 about?
    // GuildAuditLogs.Actions.INTEGRATION_UPDATE!,
    // GuildAuditLogs.Actions.INTEGRATION_DELETE!,
  ]

  constructor(public client: UndoBot) {}

  filter(auditLogs: GuildAuditLogs) {
    for (const audit of auditLogs.entries.values())
      if (audit.executor.id === this.client.user!.id && audit.reason)
        // 1234567890 | Undo ...
        auditLogs.entries.delete(audit.reason.split(" ")[0]), auditLogs.entries.delete(audit.id)
      else if (!this.canUndoList.includes(GuildAuditLogs.Actions[audit.action]!)) auditLogs.entries.delete(audit.id)
    return auditLogs
  }

  // todo: finish adding undos
  info(entry: GuildAuditLogsEntry, guild: Guild): GuildAuditLogUndoData {
    const me = guild.me!
    const reason = `${entry.id} | Requested to undo `
    const target = entry.target as Base & { id: string }
    const _action = `${entry.action.split("_").last()} ${entry.action.split("_").slice(0, -1)}`.toLowerCase()
    const action = `${_action} ${entry.target}`
    const partial = !(entry.target instanceof Base)
    const getAction = (symbol: string, name?: string) => 
      partial ? `${_action} ${name ? `${symbol[0]}${name}` : `<${symbol}${target.id}>`}` : action
    const getChange = (key: string) => entry.changes?.find(change => change.key === key)
    const old = (key: string) => getChange(key)?.old
    const updated = (key: string) => getChange(key)?.new
    const genericCreateUndo: GuildAuditLogUndoData["undo"] = async function(this: GuildAuditLogUndoData) {
      const item = target as any
      await item.delete(`${reason}${this.action}`)
      return { success: true }
    }

    switch (GuildAuditLogs.Actions[entry.action]) {
      case GuildAuditLogs.Actions.CHANNEL_CREATE!: {
        return {
          action: getAction("#", updated("name")),
          hasPermission: me.hasPermission("MANAGE_CHANNELS"),
          get outdated() {
            return (entry.target as GuildChannel).deleted !== false
          },
          undo: genericCreateUndo
        }
      }
      case GuildAuditLogs.Actions.CHANNEL_DELETE!: {
        return {
          action: getAction("#", old("name")),
          hasPermission: me.hasPermission("MANAGE_CHANNELS"),
          async undo() {
            await guild.channels.create(old("name") as string, {
              type: old("type") as number,
              permissionOverwrites: old("permission_overwrites"),
              topic: old("topic"),
              rateLimitPerUser: old("rate_limit_per_user"),
              nsfw: old("nsfw"),
              userLimit: old("user_limit"),
              reason: `${reason}${this.action}`,
            })
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.CHANNEL_OVERWRITE_CREATE!: {

      }
      case GuildAuditLogs.Actions.CHANNEL_OVERWRITE_DELETE!: {

      }
      case GuildAuditLogs.Actions.CHANNEL_OVERWRITE_UPDATE!: {

      }
      case GuildAuditLogs.Actions.CHANNEL_UPDATE!: {
        let action = getAction("#", updated("name"))
        if (entry.changes!.length === 1) {
          if (old("name") !== updated("name")) action = `rename #${updated("name")}`
          else if (old("topic") !== updated("topic")) action = `change the topic of <#${target.id}>`
          else if (old("nsfw") !== updated("nsfw")) action = `${updated("nsfw") ? "mark" : "unmark"} <#${target.id}> as NSFW`
        }
        return {
          action,
          hasPermission: me.hasPermission("MANAGE_CHANNELS"),
          get outdated() {
            return (entry.target as GuildChannel).deleted !== false
          },
          async undo() {
            const channel = entry.target as GuildChannel
            await channel.edit(
              {
                name: old("name"),
                permissionOverwrites: old("permission_overwrites"),
                topic: old("topic"),
                rateLimitPerUser: old("rate_limit_per_user"),
                nsfw: old("nsfw"),
                userLimit: old("user_limit"),
              },
              `${reason}${this.action}`
            )
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.MEMBER_BAN_ADD!: {
        return {
          action: `ban <@${target.id}>`,
          hasPermission: me.hasPermission("BAN_MEMBERS"),
          async undo() {
            await guild.members.unban(target.id, `${reason}${this.action}`)
            return { success: true }
          }
        }
      }
      case GuildAuditLogs.Actions.MEMBER_BAN_REMOVE!: {
        return {
          action: `unban <@${target.id}>`,
          hasPermission: me.hasPermission("BAN_MEMBERS"),
          async undo() {
            await guild.members.ban(target.id, { reason: `${reason}${this.action}` })
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.MEMBER_UPDATE!: {
        // return {
        //   action: `edit <@${target.id}>`,
        //   hasPermission: me.hasPermission("BAN_MEMBERS"),
        //   async undo() {
        //     return { success: true }
        //   },
        // }
      }
      case GuildAuditLogs.Actions.MEMBER_ROLE_UPDATE!: {
        // it is at this point that i realise typescript for a bot like this is kinda useless
        const added = updated("$add"), removed = updated("$remove")
        let action = `update <@${target.id}>'s roles`
        if (removed && added) {}
        else if (removed)
          action = `remove ${
            removed.length > 1
              ? "roles"
              : guild.roles.cache.has(removed[0].id)
              ? `<@&${removed[0].id}>`
              : `@${removed[0].name}`
          } from <@${target.id}>`
        else if (added) action = `add ${
          added.length > 1
            ? "roles"
            : guild.roles.cache.has(added[0].id)
            ? `<@&${added[0].id}>`
            : `@${added[0].name}`
        } to <@${target.id}>`
        return {
          action,
          hasPermission:
            me.hasPermission("MANAGE_ROLES") &&
            [].concat(added || [], removed || []).every((r: { id: string }) => guild.roles.cache.get(r.id)?.position! < me.roles.highest.position),
          async undo() {
            const member = await guild.members.fetch(target.id).silenceErrors(["Unknown User", "Unknown Member"])
            if (!member) return { success: false, result: "this member is not in the server anymore." }
            await member.roles.set(
              member.roles.cache
                .keyArray()
                .concat(...(removed || []).map((r: { id: string }) => r.id))
                .trim(...(added || []).map((r: { id: string }) => r.id)),
              `${reason}${this.action}`
            )
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.MEMBER_MOVE!: {

      }
      case GuildAuditLogs.Actions.BOT_ADD!: {
        return {
          action,
          hasPermission: me.hasPermission("KICK_MEMBERS"),
          async undo() {
            const kick = await (guild.client as any)
              .api.guilds(guild.id)
              .members(target.id)
              .delete({ reason: `${reason}${this.action}` })
              .silenceErrors(["Unknown User", "Unknown Member"])
            if (!kick) return { success: false, result: "this bot is no longer in the server." }
            return { success: true }
          }
        }
      }
      case GuildAuditLogs.Actions.ROLE_CREATE!: {
        return {
          action: getAction("@&", updated("name")),
          hasPermission:
            me.hasPermission("MANAGE_ROLES") && guild.roles.cache.get(target.id)?.position! < me.roles.highest.position,
          get outdated() {
            return (entry.target as Role).deleted !== false
          },
          undo: genericCreateUndo,
        }
      }
      case GuildAuditLogs.Actions.ROLE_UPDATE!: {
        return {
          action: getAction("@&", updated("name")),
          hasPermission: me.hasPermission("MANAGE_ROLES") && guild.roles.cache.get(target.id)?.position! < me.roles.highest.position,
          get outdated() {
            return (entry.target as Role).deleted !== false
          },
          async undo() {
            const role = target as Role
            await role.edit({
              name: old("name"),
              permissions: old("permissions"),
              color: old("color"),
              mentionable: old("mentionable"),
              hoist: old("hoist"),
            }, `${reason}${this.action}`)
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.ROLE_DELETE!: {
        return {
          action: getAction("@&", old("name")),
          hasPermission: me.hasPermission("MANAGE_ROLES") && guild.roles.cache.get(target.id)?.position! < me.roles.highest.position,
          async undo() {
            await guild.roles.create({
              data: {
                name: old("name"),
                permissions: old("permissions"),
                color: old("color"),
                mentionable: old("mentionable"),
                hoist: old("hoist"),
              },
              reason: `${reason}${this.action}`,
            })
            return { success: true }
          }
        }
      }
      case GuildAuditLogs.Actions.INVITE_CREATE!: {
        const code = old("code") || updated("code")
        return {
          action: `create invite \`${(target as any)?.code || code}\``,
          hasPermission: target ? (target as unknown as Invite).deletable : me.hasPermission("MANAGE_GUILD"),
          get outdated() {
            return !target || partial
          },
          undo: genericCreateUndo
        }
      }
      case GuildAuditLogs.Actions.WEBHOOK_CREATE!: {
        return {
          action: `create webhook ${(target as unknown as Webhook)?.name || ""}`,
          hasPermission: me.hasPermission("MANAGE_WEBHOOKS"),
          outdated: partial,
          undo: genericCreateUndo
        }
      }
      case GuildAuditLogs.Actions.WEBHOOK_UPDATE!: {

      }
      case GuildAuditLogs.Actions.WEBHOOK_DELETE!: {

      }
      case GuildAuditLogs.Actions.EMOJI_CREATE!: {
        return {
          action: partial
            ? `create an [animated](https://cdn.discordapp.com/emojis/a_${target.id}.gif)/[emoji](https://cdn.discordapp.com/emojis/${target.id}.png)`
            : action,
          hasPermission: me.hasPermission("MANAGE_EMOJIS"),
          get outdated() {
            return (entry.target as GuildEmoji).deleted !== false
          },
          undo: genericCreateUndo,
        }
      }
      case GuildAuditLogs.Actions.EMOJI_UPDATE!: {
        return {
          action: partial
            ? `edit an [animated](https://cdn.discordapp.com/emojis/a_${target.id}.gif)/[emoji](https://cdn.discordapp.com/emojis/${target.id}.png)`
            : action,
          hasPermission: me.hasPermission("MANAGE_EMOJIS"),
          get outdated() {
            return (entry.target as GuildEmoji).deleted !== false
          },
          async undo() {
            const emoji = target as GuildEmoji
            await emoji.edit(
              {
                name: old("name"),
                roles: old("roles"),
              },
              `${reason}${this.action}`
            )
            return { success: true }
          },
        }
      }
      case GuildAuditLogs.Actions.EMOJI_DELETE!: {
        return {
          action: partial
            ? `delete an [animated](https://cdn.discordapp.com/emojis/a_${target.id}.gif)/[emoji](https://cdn.discordapp.com/emojis/${target.id}.png)`
            : action,
          hasPermission: me.hasPermission("MANAGE_EMOJIS"),
          async undo() {
            const emoji = await guild.emojis
              .create(`https://cdn.discordapp.com/emojis/${target.id}.png`, old("name"), {
                reason: `${reason}${this.action}`,
              })
              .catchErrors(/image: Invalid image data/, () =>
                guild.emojis
                  .create(`https://cdn.discordapp.com/emojis/a_${target.id}.gif`, old("name"), {
                    reason: `${reason}${this.action}`,
                  })
                  .silenceErrors(/image: Invalid image data/)
              )
            if (!emoji) return { success: false, result: "couldn't resolve the image for the emoji."}
            return { success: true }
          }
        }
      }
      case GuildAuditLogs.Actions.MESSAGE_PIN!: {
        return {
          action: `pin a message in <#${(entry.extra as any).channel.id}>`,
          get outdated() {
            return (entry.extra as any).channel.deleted !== false
          },
          hasPermission: !!((entry.extra as any).channel as GuildChannel).hasPermission?.("MANAGE_MESSAGES"),
          async undo() {
            const channel = (entry.extra as any).channel as TextChannel
            const message = await channel.messages.fetch((entry.extra as any).messageID).silenceErrors("Unknown Message")
            if (!message) return { success: false, result: "this message has been deleted." }
            if (message.pinned) return { success: false, result: "this message is already pinned." }
            await message.pin({ reason: `${reason}${this.action}`})
            return { success: true }
          }
        }
      }
      case GuildAuditLogs.Actions.MESSAGE_UNPIN!: {
        return {
          action: `unpin a message in <#${(entry.extra as any).channel.id}>`,
          get outdated() {
            return (entry.extra as any).channel.deleted !== false
          },
          hasPermission: !!((entry.extra as any).channel as GuildChannel).hasPermission?.("MANAGE_MESSAGES"),
          async undo() {
            const channel = (entry.extra as any).channel as TextChannel
            const message = await channel.messages.fetch((entry.extra as any).messageID).silenceErrors("Unknown Message")
            if (!message) return { success: false, result: "this message has been deleted." }
            if (!message.pinned) return { success: false, result: "this message has already been unpinned." }
            await message.unpin({ reason: `${reason}${this.action}`})
            return { success: true }
          }
        }
      }
    }

    return { // typescript complaining about this being undefined if return value is | void
      action: "",
      outdated: true,
      hasPermission: false,
      async undo() { return { success: false } }
    }
  }
}

export default Util