const BaseCommand = require('./BaseCommand');

class PrefixCommand extends BaseCommand {
  constructor(moduleExports) {
    super({
      name: moduleExports.name,
      aliases: moduleExports.aliases || [],
      description: moduleExports.description || '',
      cooldown: moduleExports.cooldown || 0,
      requiredRoles: moduleExports.roles || [],
      antiBot: moduleExports.antiBot || false,
      category: moduleExports.category || 'uncategorized',
      devOnly: moduleExports.devOnly || false,
      guildOnly: moduleExports.guildOnly !== undefined ? moduleExports.guildOnly : true
    });
    this._execute = moduleExports.execute;
  }

  async execute(message, args, client) {
    return this._execute(message, args, client);
  }
}

module.exports = PrefixCommand;
