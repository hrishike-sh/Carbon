class SlashCommand {
  constructor(moduleExports) {
    this.data = moduleExports.data;
    this._execute = moduleExports.execute;
  }

  async execute(interaction, client) {
    return this._execute(interaction, client);
  }
}

module.exports = SlashCommand;
