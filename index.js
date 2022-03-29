require('dotenv').config();

const { Client, Intents } = require('discord.js');

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
        msg.guild.channels.fetchActiveThreads()
            .then(fetched => {
                console.log(`There are ${fetched.threads.size} threads.`);
                fetched.threads.map((thread) => {
                    console.log(thread.name);
                });
            })
            .catch(console.error);
        break;
     }
  })

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN);