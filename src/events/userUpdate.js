module.exports = {
  name: 'userUpdate',

  async execute(oldUser, newUser) {
    if (oldUser.username === newUser.username) return;
    // Username tracking disabled — no persistent storage configured.
    // Re-enable by implementing the storage backend and removing this early return.
  }
};
