require('dotenv').config();

const { Client, Intents, MessageEmbed } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    switch (msg.content) {
      case "yulia getthreads":
        msg.channel.send("Pong!");
        break;
      case "yulia getthreads active":
        let threadsEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('List of Threads')
            .setDescription('Here is the list of threads in this server')
            .addField('NOTE', 'These threads are accurate only as of the date below. To refresh, let your officers know.')
            .setTimestamp();
        await msg.guild.channels.fetchActiveThreads()
            .then(fetched => {
                fetched.threads.map((thread) => {
                    const details = thread.parent.name.concat("\n Created: ", thread.createdAt.toDateString());
                    if (!!thread.lastMessage?.createdAt) {
                        details.concat("\n Last Message: ", thread.lastMessage.createdAt.toDateString());
                    }
                    threadsEmbed.addField(thread.name, details);
                });
            })
            .catch(console.error);
        msg.channel.send({ embeds: [threadsEmbed] });
        break;
     }
  })

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN);