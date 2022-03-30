require('dotenv').config();

const { Client, Intents, MessageEmbed } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    switch (msg.content) {
      case "yulia getthreads sorted":
        break;
      case "yulia getthreads active":
        let threadsEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('List of Threads')
            .setDescription('Here is the list of threads in this server')
            .setTimestamp();
        // https://discord.js.org/#/docs/discord.js/stable/class/GuildChannelManager

        let lastChannel = '';
        let guildId = msg.guild.id;
        let arrowForward = ":arrow_forward:";
        let firstChannel = true;

        await msg.guild.channels.fetchActiveThreads()
            .then(fetched => {
                fetched.threads.sort((thread1, thread2) => {
                    if(thread1.parent.name < thread2.parent.name) { return -1; }
                    if(thread1.parent.name > thread2.parent.name) { return 1; }
                    return 0;
                }).map((thread) => {
                    if (thread.parent.name !== lastChannel)
                    {
                      if (!firstChannel) {
                        threadsEmbed.addField('\u200B', '\u200B');
                      }
                      threadsEmbed.addField(arrowForward.concat("\t", thread.parent.name.toUpperCase()), '\u200B', false);
                      lastChannel = thread.parent.name;
                      firstChannel = false;
                    }

                    let details = "Created: ".concat(thread.createdAt.toDateString());
                    if (thread.lastMessage) {
                        details = details.concat("\n Last Message: ", thread.lastMessage.createdAt.toDateString());
                    }
                    details = details.concat(`\n[Go to ${thread.name}](https://discord.com/channels/${guildId}/${thread.id})`);

                    threadsEmbed.addField(thread.name, details, true);
                });
            })
            .catch(console.error);
        msg.channel.send({ embeds: [threadsEmbed] });
        break;
     }
  })

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN);