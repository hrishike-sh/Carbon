const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
    item_id: String,
    value: Number,
    display: {
        name: String,
        thumbnail: String,
    },
    lastUpdated: Number,
})

module.exports = mongoose.model('item', ItemSchema)
