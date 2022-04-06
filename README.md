# threads-yulia
A Discord Bot to create a list of active threads in a server. Made for [Ohara](https://eu.finalfantasyxiv.com/lodestone/freecompany/9228860798900648108/).

Credits to Katelynn Au'mar for helping with the algo and for being an MVP and hosting this bot, and also to Prim Rose, Fufugi Fugi, and [Felicia Floppe](https://github.com/alisarac) as well.

### Invite to your server:
https://discord.com/api/oauth2/authorize?client_id=958397308502958110&permissions=8&scope=bot

## Running on your local

Requires [Node (17.8.0 or later)](https://nodejs.org/en/).

This bot is using a [MongoDB Cloud Database](https://www.mongodb.com/try/download/community) but feel free to alter the code to use other types of persistence.

1. Install the above prerequisites
2. Clone this repository and navigate to it on your local IDE.
3. Run `node index.js` in this repository on a terminal.

## Features
*Things to note: As of Discord s.v. 122087, thread links displayed by this bot will not be redirectable on mobile.*

`+getAllThreads`
Get all threads in the server, minus excluded channels and archived threads older than 2 months.

`+addExclusion <#channelname>`
Add a server to not include in the thread list

`+removeExclusion <#channelname>`
Remove a server from the exclusion list.

`+getExcludedChannels`
See which channels are excluded from the thread list.

`+help`
See this help list.
