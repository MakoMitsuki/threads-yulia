require('dotenv').config();
const fetch = require("node-fetch");

const { Client, Intents, MessageEmbed } = require('discord.js');

const token = process.env.CLIENT_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const getArchivedThreads = async (channelId) => {
  let archivedThreads = [];

  let myHeaders = new fetch.Headers();
  myHeaders.append("Authorization", `Bot ${token}`);

  let requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  await fetch(`https://discordapp.com/api/channels/${channelId}/threads/archived/public`, requestOptions)
    .then(response => response.json())
    .then(data => {
      archivedThreads = data.threads;
    })
    .catch(error => console.log('error', error));
  
  return archivedThreads;
};

const threadDetails = (thread, guildId) => {
  let details = "Created: ".concat(thread.createdAt.toDateString());
  if (thread.lastMessage) {
      details = details.concat("\n Last Message: ", thread.lastMessage.createdAt.toDateString());
  }
  details = details.concat(`\n[Go to ${thread.name}](https://discord.com/channels/${guildId}/${thread.id})`);
  return details;
};

const apiThreadDetails = (thread, guildId) => {
  let details = "";
  if (thread.thread_metadata?.archived) {
    details = details.concat("Archived: ", thread.thread_metadata.archive_timestamp);
  }
  details = details.concat(`\n[Go to ${thread.name}](https://discord.com/channels/${guildId}/${thread.id})`);
  return details;
};

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
            .setThumbnail(msg.guild.iconURL())
            .setFooter(`Refreshed by ${msg.author.username}`, msg.author.avatarURL())
            .setTimestamp();

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

                      // get archived threads
                      getArchivedThreads(thread.parent.id).then(async (archivedThreads) => {
                        await archivedThreads.forEach(t => {
                          console.log(t);
                          threadsEmbed.addField(`:lock:\t${t.name}`, apiThreadDetails(t, guildId), true)
                        });
                      });

                      lastChannel = thread.parent.name;
                      firstChannel = false;
                    }

                    threadsEmbed.addField(thread.name, threadDetails(thread, guildId), true);
                });
            })
            .catch(console.error);
        msg.channel.send({ embeds: [threadsEmbed] });
        break;
     }
  })

//make sure this line is the last line
client.login(token);