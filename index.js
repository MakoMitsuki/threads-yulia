require('dotenv').config();

const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    switch (msg.content) {
      case "yulia getallthreads":
        msg.channel.send("Pong!");
        break;
      case "!meme":
        msg.channel.send("Here's your meme!");
        break;
     }
  })

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN);