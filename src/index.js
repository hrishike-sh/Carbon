const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { token: process.env.token });
require('dotenv').config();

console.log(process.env.token);

manager.on('shardCreate', (shard) =>
  console.log(`Connected shard: ${shard.id}`)
);

manager.spawn();
