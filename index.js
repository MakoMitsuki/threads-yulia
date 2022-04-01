require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require("node-fetch");

const { Client, Intents, MessageEmbed, Message } = require('discord.js');

const token = process.env.CLIENT_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const DiscordServer = require("./schema.js");

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  keepAlive: true
}).then(() => {
  console.log('🚀 Connected to the MongoDB database!');
}).catch((error) => {
  console.log(error);
});

const arrowForward = ":arrow_forward:";

const createDiscordServerRecord = (guild) => {
  const discordServer = new DiscordServer({
    _id: mongoose.Types.ObjectId(),
    serverId: guild.id,
    serverName: guild.name,
    channelExceptionList: []
  });
  discordServer.save()
    .then(() => console.log(result))
    .catch((err) => console.log(err));

  return discordServer;
}

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
  console.log(`🚀 Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  let guildId = msg.guild.id;

  if(msg.content === "+getArchivedThreads") {
    let threadsEmbedAll = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('List of Threads')
        .setDescription('Here is the list of all threads in this server')
        .setThumbnail(msg.guild.iconURL())
        .setFooter(`Refreshed by ${msg.author.username}`, msg.author.avatarURL())
        .setTimestamp();
    
    let channels = await msg.guild.channels.fetch();

    await Promise.all(channels.map(async (channel) => {
      let hasHeader = false;

      // get active threads
      /*channel.threads.forEach(t => {
        threadsEmbedAll.addField(t.name, threadDetails(t, guildId), true);
      });*/

      // get archived threads
      let result = [];
      await getArchivedThreads(channel.id).then(r => result = r);
      if(result) {
        if (!hasHeader && result.length !== 0){
          threadsEmbedAll.addField(arrowForward.concat("\t", channel.name.toUpperCase()), '\u200B', false);
          hasHeader = true;
        }
        
        result.forEach(t => {
          threadsEmbedAll.addField(`:lock:\t${t.name}`, apiThreadDetails(t, guildId), true);
        });
      };
      
      if (hasHeader) {
        threadsEmbedAll.addField('\u200B', '\u200B');
      };
    }));

    msg.channel.send({ embeds: [threadsEmbedAll] }); // Here, instead of above.
  }
  else if (msg.content === "+getActiveThreads"){
    let threadsEmbedActive = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('List of Active Threads')
      .setDescription('Here is the list of active threads in this server')
      .setThumbnail(msg.guild.iconURL())
      .setFooter(`Refreshed by ${msg.author.username}`, msg.author.avatarURL())
      .setTimestamp();

    let lastChannel = '';
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
                threadsEmbedActive.addField('\u200B', '\u200B');
              }
              threadsEmbedActive.addField(arrowForward.concat("\t", thread.parent.name.toUpperCase()), '\u200B', false);

              lastChannel = thread.parent.name;
              firstChannel = false;
            }

            threadsEmbedActive.addField(thread.name, threadDetails(thread, guildId), true);
        });
      })
      .catch(console.error);
    msg.channel.send({ embeds: [threadsEmbedActive] });
  }
  else if (msg.content.startsWith("+addExclusion")){
    let channelToExclude = msg.mentions.channels.first();
    if (channelToExclude) {
      let thisServer = await DiscordServer.findOne({ serverId: guildId }).exec();
      if (!thisServer) {
        thisServer = new DiscordServer({
          _id: mongoose.Types.ObjectId(),
          serverId: msg.guild.id,
          serverName: msg.guild.name,
          channelExceptionList: []
        });
        thisServer.channelExceptionList.push({
          _id: channelToExclude.id,
          channelName: channelToExclude.name
        });
        thisServer.save()
          .then(() => msg.reply(`**${channelToExclude.name}** is added to the exclusion list.`))
          .catch((err) => console.log(err));
      } else {
        thisServer.channelExceptionList.push({
          _id: channelToExclude.id,
          channelName: channelToExclude.name
        });
        thisServer.save().then(() => {
          msg.reply(`**${channelToExclude.name}** is added to the exclusion list.`);
        }).catch((err) => console.log(err));
      }
    }
    else {
      msg.reply(`Did you indicate a channel to exclude? Please try it again using \`+addexclusion #your-channel-here\`!`);
    }
  }
  else if (msg.content === "+getExcludedChannels"){

  }
})

//make sure this line is the last line
client.login(token);