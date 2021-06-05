import { GuildChannel, Message, MessageEmbed as Embed, GuildAuditLogs } from "discord.js"

const
  color = "#5865f2",
  success = "#70bc70",
  error = "#e87070"

export default async function Undo(message: Message, args: string[]) {
  const { client } = message
  const settings = client.db.fetchGuild(message.guild!)
  switch (args[0]) {
    default: {
      const logs = client.util.filter(await message.guild!.fetchAuditLogs({ limit: 100 }))
      const entries = logs.entries
        .map(entry => client.util.info(entry, message.guild!))
        .filter(e => !e.outdated && e.hasPermission)
      if (!isNaN(+args[0]) && +args[0] !== 1) {
        if (args[0].length < 16 || +args[0] > 22) { // undo a certain amount
          const n = +args[0]
          if (n > 50)
            return message.channel.send(
              new Embed().setColor(error).setDescription("You can only undo a maximum of 50 actions at a time.")
            )
          if (n <= 0)
            return message.channel.send(
              new Embed().setColor(error).setDescription("Please input a valid number.")
            )
          if ((message.guild as any).undoing)
            return message.channel.send(
              new Embed()
                .setColor(error)
                .setDescription("This server is already undoing a bunch of actions. Please try again later")
            )
          let i = 0, done = 0
          const successes = [], errors = []
          let m: Message | undefined = await message.channel.send(
            new Embed()
              .setColor(color)
              .setDescription(`\`[${" ".repeat(10)}]\` Undoing ${i}/${n}...`)
          )
          const edit = () =>
            m
              ?.edit(
                new Embed()
                  .setColor(color)
                  .setDescription(`\`[${"#".repeat(Math.round((i * 10) / n)).padEnd(10, " ")}]\` Undoing ${i}/${n}...`)
              )
              .catchErrors("Unknown Message", () => (m = undefined))
          ;(message.guild as any).undoing = true
          try {
            for (const entry of entries.first(n)) {
              i++
              if (entry.outdated || !entry.hasPermission) continue
              const res = await entry.undo()
              if (res.success) successes.push(res.result)
              else errors.push(res.result)
              done++
              await edit()
              await waitTimeout(200)
            }
          } catch(e) {
            console.log(e)
            return message.channel.send(
              new Embed()
              .setColor(error)
              .setDescription(`Something went wrong trying to undo ${entries[i-1].action}.`)
            )
          } finally {
            delete (message.guild as any).undoing
          }
          const embed = new Embed()
          .setColor(success)
          .setDescription(`Successfully undid ${done} actions.`)
          if (successes.length) embed.addField("Success", `• ${successes.join("\n• ")}`)
          if (errors.length) embed.addField("Errors", `• ${errors.join("\n• ")}`)
          await edit()
          return message.channel.send(embed)
        } else { // undo a certain ID
          if (!logs.entries.has(args[0])) {
            for (const _ of 2) {
              logs.entries = logs.entries.concat((await message.guild!.fetchAuditLogs({ limit: 100 })).entries)
              if (logs.entries.has(args[0])) break
            }
            if (!logs.entries.has(args[0]))
              return message.channel.send(
                new Embed().setColor(error).setDescription("I couldn't find the audit log entry you were looking for.")
              )
            const entry = client.util.info(logs.entries.get(args[0])!, message.guild!)
            if (entry.outdated)
              return message.channel.send(
                new Embed()
                  .setColor(error)
                  .setDescription("This audit log entry is now stale/outdated and cannot be undone.")
              )
            if (!entry.hasPermission)
              return message.channel.send(
                new Embed().setColor(error).setDescription("I am missing the permissions needed to undo this action.")
              )
            try {
              const res = await entry.undo()
              if (res.success)
                return message.channel.send(
                  new Embed().setColor(success).setDescription(`Successfully undid the action: ${entry.action}.`)
                )
              else
                return message.channel.send(
                  new Embed()
                    .setColor(success)
                    .setDescription(`Could not undo the action ${entry.action}${res.result ? `: ${res.result}` : "."}`)
                )
            } catch (e) {
              console.error(e)
              return message.channel.send(
                new Embed().setColor(error).setDescription("Something went wrong when trying to undo this action.")
              )
            }
          }
        }
      } else {
        const entry = entries.first()
        if (!entry) return message.channel.send(new Embed().setDescription("There is nothing to undo!").setColor(error))
        try {
          const res = await entry.undo()
          if (res.success)
            return message.channel.send(
              new Embed().setColor(success).setDescription(`Successfully undid the action: ${entry.action}.`)
            )
          else
            return message.channel.send(
              new Embed()
                .setColor(success)
                .setDescription(`Could not undo the action ${entry.action}${res.result ? `: ${res.result}` : "."}`)
            )
        } catch(e) {
          console.error(e)
          return message.channel.send(
            new Embed().setColor(error).setDescription("Something went wrong when trying to undo this action.")
          )
        }
      }
    }

    case "help":
      return message.channel.send(
        new Embed()
          .setColor(color)
          .setTitle("UndoBot")
          .setDescription(`
            Hey there! I'm Undo and I can help you easily undo mistakes such as banning a user or removing a role from a member.
            Simply say \`${settings.trigger}\` to undo the last action made on the server.

            __**Commands**__
            • ${settings.trigger} help: bring up this embed.
            • ${settings.trigger} list: list the actions from the last 100 actions that can be undone.
            • ${settings.trigger} [ID]: undo a specific action.
            • ${settings.trigger} config: view config for this server.
              - ${settings.trigger} config trigger [trigger]: set the trigger used to undo.
          `.stripIndents(12))
              // - ${settings.trigger} config permission [permission]: set the trigger used to undo.
      )
  
    case "list": {
      const logs = client.util.filter(await message.guild!.fetchAuditLogs({ limit: 100 }))
      const list = logs.entries
        .map(entry => client.util.info(entry, message.guild!))
        .filter(e => !e.outdated && e.hasPermission)
        .map(e => `• ${e.action}`)
        .slice(0, !isNaN(+args[1]) ? Math.min(Math.max(1, +args[1]), 100) : 100)
        .join("\n")
      return message.channel.send(
        new Embed()
          .setColor(color)
          .setTitle("Undo List")
          .setDescription(
            list
              ? `Here are all the actions you can undo:`
              : "You cannot undo anything right now. This may be because I am missing permissions, the actions are outdated or there are no actions to begin with."
          )
          .addFields(
            client.util.discordUtil
              .splitMessage(list, { char: "\n", maxLength: 1024 })
              .map(value => ({ name: "\u200b", value }))
          )
      )
    }

    case "config": {
      if (args[1] === "trigger") {
        const trigger = args.slice(2).join(" ") || "undo"
        if (trigger.length > 100)
          return message.channel.send(new Embed().setColor(error).setDescription("That trigger is too long!"))
        client.db.update(message.guild!, { trigger })
        return message.channel.send(new Embed().setColor(success).setDescription(`Successfully set the trigger to \`${trigger}\`.`))
      } // else if (args[1] === "permission") {}
      else {
        return message.channel.send(
          new Embed()
            .setColor(color)
            .setTitle("Undo Config")
            .setDescription(`
              **Trigger**: \`${settings.trigger}\`
            `.stripIndents())
        )
      }
    }
  }
}