class BaseCommand {
  constructor(options) {
    this.name = options.name;
    this.aliases = options.aliases || [];
    this.description = options.description || '';
    this.cooldown = options.cooldown || 0;
    this.requiredRoles = options.requiredRoles || [];
    this.antiBot = options.antiBot || false;
    this.category = options.category || 'uncategorized';
    this.devOnly = options.devOnly || false;
    this.guildOnly = options.guildOnly !== undefined ? options.guildOnly : true;
  }

  async execute() {
    throw new Error(`Command ${this.name} has no execute method`);
  }
}

module.exports = BaseCommand;
