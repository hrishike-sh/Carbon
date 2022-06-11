const DB = require('../database/models/currency')

class Currency {
    /**
     *
     * @param {String} userId ID of the user
     * @returns {Object} Returns a Mongo model
     */
    static async getUser(userId) {
        let user = await DB.findOne({
            userId,
        })
        if (!user) {
            user = new DB({
                userId,
                Balance: 0,
            })
        }

        return user
    }

    /**
     *
     * @param {String} userId ID of the user
     * @param {Number} amount Amount to be added
     * @returns {Number} Total Balance of the user
     */
    static async addCoins(userId, amount) {
        const user = await this.getUser(userId)

        if (isNaN(amount))
            throw new Error('Amount provided is not a valid Number.')
        user.Balance += amount
        user.save()

        return user.Balance
    }

    /**
     *
     * @param {String} userId ID of the user
     * @param {Number} amount Amount to be removed
     * @returns {Number} Total Balance of the user
     */
    static async removeCoins(userId, amount) {
        const user = await this.getUser(userId)

        if (isNaN(amount))
            throw new Error('Amount provided is not a valid Number.')
        user.Balance -= amount
        user.save()

        return user.Balance
    }
}

module.exports = Currency
