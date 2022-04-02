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

client.on('ready', () => {
  console.log(`🚀 Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  let guildId = msg.guild.id;

  if(msg.content === "+getAllThreads") {
    let threadsEmbedAll = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('List of Threads')
        .setDescription('Archived threads that have been inactive for more than two months and channels excluded by server administrators are not shown.')
        .setThumbnail(msg.guild.iconURL())
        .setFooter(`Refreshed by ${msg.author.username}`, msg.author.avatarURL())
        .setTimestamp();

    let excluded = [];
    let activeThreads = null;
    let listMap = new Map();

    //get date two months before now
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() - 2);
    
    let channels = await msg.guild.channels.fetch();
    await DiscordServer.findOne({ serverId: guildId }).then(function (s) {
      excluded = s ? s.channelExceptionList : [];
    });
    await msg.guild.channels.fetchActiveThreads()
      .then(fetched => {
        activeThreads = fetched.threads.length == 0 ? [] : fetched.threads;
      })
      .catch(console.error);

    await Promise.all(channels.filter((ch) => {
      return !excluded.includes(ch.id) && ch.type !== 'GUILD_VOICE' && ch.type !== 'GUILD_CATEGORY' && ch.type !== 'GUILD_STAGE_VOICE'
    })
    .map(async (channel) => {
      let header = "";
      let list = "";

      // get active threads
      await activeThreads.map(t => {
        if (t.parent.id === channel.id) {
          if (header === ""){
            header = channel.name.toUpperCase();
          }
          list = list.concat(`\n<#${t.id}>`);
        }
      });

      // get archived threads
      await getArchivedThreads(channel.id).then(result => {
        if(result) {
          if (header === "" && result.length !== 0){
            header = channel.name.toUpperCase();
          }
          
          result.forEach(t => {
            // check if the thread has not been inactive for x months
            if (Date.parse(t.thread_metadata.archive_timestamp) > expiryDate) {
              list = list.concat(`\n :card_box: [${t.name}](https://discord.com/channels/${guildId}/${t.id})`);
            }
          });
        };
      });

        if (header !== "" && list !== "") {
          listMap.set(parseInt(channel.rawPosition), {cName: header, details: list});
        }
    }));

    let mapAsc = new Map([...listMap].sort((a, b) => a[0] - b[0]));
    mapAsc.forEach((value) => { threadsEmbedAll.addField(value.cName, value.details); });

    msg.channel.send({ embeds: [threadsEmbedAll] }); // Here, instead of above.
  }
  else if (msg.content.startsWith("+addExclusion")){
    let channelToExclude = msg.mentions.channels.first();
    if (channelToExclude) {
      let thisServer = await DiscordServer.findOne({ serverId: guildId }).exec();
      
      // TODO: stop embarassing yourself yulia and refactor this code 
      if (!thisServer) {
        thisServer = new DiscordServer({
          _id: mongoose.Types.ObjectId(),
          serverId: msg.guild.id,
          serverName: msg.guild.name,
          channelExceptionList: []
        });
        thisServer.channelExceptionList.push(channelToExclude.id);
        thisServer.save()
          .then(() => msg.reply(`**${channelToExclude.name}** is added to the exclusion list.`))
          .catch((err) => console.log(err));
      } else {
        let isExcluded = thisServer.channelExceptionList.includes(channelToExclude.id);
        if (isExcluded){
          msg.reply(`**${channelToExclude.name}** is already added to the exclusion list.`);
        } else {
          thisServer.channelExceptionList.push(channelToExclude.id);
          thisServer.save().then(() => {
            msg.reply(`**${channelToExclude.name}** is added to the exclusion list!`);
          }).catch((err) => console.log(err));
        }
      }
    }
    else {
      msg.reply(`Did you indicate a channel to exclude? Please try it again using \`+addExclusion #your-channel-here\`!`);
    }
  }
  else if (msg.content.startsWith("+removeExclusion")){
    let channelToExclude = msg.mentions.channels.first();
    if (channelToExclude) {
      let thisServer = await DiscordServer.findOne({ serverId: guildId }).exec();
      
      // TODO: stop embarassing yourself yulia and refactor this code 
      if (!thisServer) {
        msg.reply(`This server has no exclusions.`);
      } else {
        let isExcluded = thisServer.channelExceptionList.includes(channelToExclude.id);
        if (isExcluded){
          thisServer.channelExceptionList.pull(channelToExclude.id);
          thisServer.save().then(() => {
            msg.reply(`**${channelToExclude.name}** is removed from the exclusions ist!`);
          }).catch((err) => console.log(err));
        } else {
          msg.reply(`**${channelToExclude.name}** is not the exclusion list so there is no need to remove it.`);
        }
      }
    }
    else {
      msg.reply(`Did you indicate a channel to remove? Please try it again using \`+removeExclusion #your-channel-here\`!`);
    }
  }
  else if (msg.content === "+getExcludedChannels"){
    let thisServer = await DiscordServer.findOne({ serverId: guildId }).exec();
    if (!thisServer) {
      msg.reply(`There are no excluded channels in this server.`);
    }
    else {
      if (thisServer.channelExceptionList.length == 0) {
        msg.reply(`There are no excluded channels in this server.`);
      } else {
        let reply = "__**Excluded Channels List**__";
        thisServer.channelExceptionList.forEach(channel => {
          reply = reply.concat(`\n<#${channel}>`);
        });
        msg.reply(reply);
      }
    }
  }
})

//make sure this line is the last line
client.login(token);