const { Client, IntentsBitField, ApplicationCommandOptionType, ApplicationCommandData } = require('discord.js')
const { Player } = require('olebeh-music-player')

const client = new Client({
  intents: [
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.Guilds
  ]
})

// Creating our Music Player
const player = new Player(client)

// Creating "play" command
const commands = [
  {
    name: 'play',
    description: 'Plays selected song!',
    options: [
      {
        name: 'play',
        description: 'Name or URL to the song',
        required: true,
        type: ApplicationCommandOptionType.String
      }
    ]
  }
]

client.on('ready', async client => {
  await client.application.commands.set(commands)

  console.log(`${client.user.tag} is ready!`)
})

// Replying to our slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return // Checking if interaction is command
  if (!interaction.inCachedGuild()) return

  if (interaction.commandName === 'play') {
    const query = interaction.options.getString('query')
    const result = await player.search(query, {
      requestedBy: interaction.member
    })

    if (!result.tracks.length) return void interaction.reply({ content: 'No tracks were found!', ephemeral: true })
    if (!interaction.member.voice.channel) return void interaction.reply({ content: 'You must be in a voice channel to use this command!', ephemeral: true })

    const queue = player.createQueue(interaction.guild, {
      channel: interaction.channel
    })

    if (!queue.connection) await queue.connect(interaction.member.voice.channel)

    queue.addTracks(result.playlist ? result.tracks : result.tracks[0])

    interaction.reply('Loading track...')

    if (!queue.playing) return await queue.play()
  }
})

// Attaching trackAdd event for replying to out slash commands whenever track is being added to the queue
client.on('trackAdd', (queue, track) => {
  queue.channel.send(`Added track ${track.title} to the queue`)
})

// Attaching trackStart event to send when track starts playing
client.on('trackStart', (queue, track) => {
  queue.channel.send(`Started playing ${track.title} at ${queue.connection.channel}!`)
})

client.login('YOUR_BOT_TOKEN_HERE')