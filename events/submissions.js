const {
    ButtonInteraction,
    Client,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} = require('discord.js')
const db = require('../database/models/submissionSchema')
const upvote = '931078295435505736'
const downvote = '931078357637038080'
module.exports = {
    name: 'interactionCreate',
    /**
     * @param {ButtonInteraction} button
     * @param {Client} client
     */
    async execute(button, client) {
        if (!button.isButton()) return

        const adminRole = '824348974449819658'
        const submissionsChannel = '924850662410453042'
        if (!button.member.roles.cache.has(adminRole)) {
            return button.reply({
                content: `You must have the <@&${adminRole}> role to accept/deny submissions!`,
                ephemeral: true,
            })
        }

        const id = button.customId
        const user = client.users.fetch(
            button.message.embeds[0].footer.text.split(':')[1],
            { cache: true }
        )
        const embed = button.message.embeds[0]
        const aaa = await db.findOne({ userId: (await user).id })
        if (id === 'accept-submit') {
            embed.setColor('GREEN')
            button.message.edit({
                embeds: [
                    {
                        title: 'Accepted',
                        description: `Accepted by: **${
                            button.user.tag
                        }**\nTime: <t:${(new Date().getTime() / 1000).toFixed(
                            0
                        )}:R>\n\nThe user was DM'd about this.`,
                    },
                    embed,
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Accept')
                            .setCustomId('accept-submit')
                            .setStyle('SUCCESS')
                            .setDisabled(),
                        new MessageButton()
                            .setStyle('DANGER')
                            .setLabel('Deny')
                            .setCustomId('deny-submit')
                            .setDisabled(),
                    ]),
                ],
            })

            client.channels.cache.get(submissionsChannel).send({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Submission #${aaa.number}`)
                        .setImage(aaa.url)
                        .setColor('DARK_BUT_NOT_BLACK'),
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setEmoji(upvote)
                            .setStyle('PRIMARY')
                            .setCustomId('upvote-submissions'),
                        new MessageButton()
                            .setEmoji(downvote)
                            .setStyle('PRIMARY')
                            .setCustomId('downvote-submissions'),
                    ]),
                ],
            })
        } else if (id === 'deny-submit') {
            embed.setColor('RED')
            button.message.edit({
                embeds: [
                    {
                        title: 'Denied',
                        description: `Denied by: **${
                            button.user.tag
                        }**\nTime: <t:${(new Date().getTime() / 1000).toFixed(
                            0
                        )}:R>\n\nThe user was DM'd about this.`,
                    },
                    embed,
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel('Accept')
                            .setCustomId('accept-submit')
                            .setStyle('SUCCESS')
                            .setDisabled(),
                        new MessageButton()
                            .setStyle('DANGER')
                            .setLabel('Deny')
                            .setCustomId('deny-submit')
                            .setDisabled(),
                    ]),
                ],
            })
            ;(await user).send({
                embeds: [
                    {
                        title: 'Submission update',
                        description: `Your submission for the event was __denied__.\n\nDenied by: ${button.user.tag}`,
                        timestamp: new Date(),
                        color: 'RED',
                    },
                ],
            })
        } else if (id == 'upvote-submissions') {
            if (aaa.voted.includes(button.user.id)) {
                return button.reply({
                    content: 'You have already voted for this submission.',
                    ephemeral: true,
                })
            }

            aaa.voted.push(button.user.id)
            aaa.votes.upvotes += 1
            aaa.votes.netVotes += 1
            aaa.save()

            return button.reply({
                content: 'Your vote has been counted!',
                ephemeral: true,
            })
        } else if (id == 'downvote-submissions') {
            if (aaa.voted.includes(button.user.id)) {
                return button.reply({
                    content: 'You have already voted for this submission.',
                    ephemeral: true,
                })
            }

            aaa.voted.push(button.user.id)
            aaa.votes.downvotes += 1
            aaa.votes.netVotes -= 1
            aaa.save()

            return button.reply({
                content: 'Your vote has been counted!',
                ephemeral: true,
            })
        }
    },
}
