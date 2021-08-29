const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true
}
const blSchema = mongoose.Schema({
  userID: reqString,
  staffId: reqString,
  expires: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
})

module.exports = mongoose.model('blacklists', blSchema)