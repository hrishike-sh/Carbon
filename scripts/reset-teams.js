// Preview: node scripts/reset-teams.js
// Back up and delete the listed teams: node scripts/reset-teams.js --apply
// Stop the bot before applying so event handlers cannot update teams mid-reset.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

async function resetTeams(collection, { apply = false, backup } = {}) {
  const teams = await collection.find({}).toArray();
  if (!apply || teams.length === 0) {
    return { found: teams.length, deleted: 0 };
  }
  // Await a durable backup before deleting only the documents we read.
  await backup(teams);
  const result = await collection.deleteMany({ _id: { $in: teams.map((team) => team._id) } });
  return { found: teams.length, deleted: result.deletedCount };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply')) throw new Error('Usage: node scripts/reset-teams.js [--apply]');
  const root = path.resolve(__dirname, '..');
  require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
  if (!process.env.mongopath) throw new Error('Missing mongopath in .env or environment.');

  try {
    await mongoose.connect(process.env.mongopath, { serverSelectionTimeoutMS: 10000 });
    const database = mongoose.connection.db;
    console.log(`Connected to database: ${database.databaseName}`);
    const result = await resetTeams(database.collection('teams'), {
      apply: args.includes('--apply'),
      backup: async (teams) => {
        const directory = path.join(root, 'logs', 'team-backups');
        await fs.mkdir(directory, { recursive: true });
        const filename = path.join(directory, `teams-${Date.now()}-${randomUUID()}.ejson`);
        const data = mongoose.mongo.BSON.EJSON.stringify({
          database: database.databaseName,
          collection: 'teams',
          createdAt: new Date(),
          teams
        }, { relaxed: false });
        const file = await fs.open(filename, 'wx');
        try {
          await file.writeFile(data, 'utf8');
          await file.sync();
        } finally {
          await file.close();
        }
        console.log(`Backup saved: ${filename}`);
      }
    });
    console.log(`Found ${result.found} teams; deleted ${result.deleted}.`);
    if (!args.includes('--apply')) console.log('Preview only. Stop the bot, then use --apply to reset these teams.');
    else console.log(`Teams remaining: ${await database.collection('teams').countDocuments({})}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    // Connection errors can contain credentials; only report the error type.
    console.error(`Team reset failed (${error.name}). Check configuration and backup directory access.`);
    process.exitCode = 1;
  });
}

module.exports = { resetTeams };
