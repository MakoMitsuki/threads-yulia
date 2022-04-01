const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
    channelName: mongoose.Schema.Types.String,
});
const serversSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    serverId: mongoose.Schema.Types.String,
    serverName: mongoose.Schema.Types.String,
    channelExceptionList: mongoose.Schema.Types.Array,
});

module.exports = mongoose.model('Servers', serversSchema);