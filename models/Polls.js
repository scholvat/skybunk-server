const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;
const NotificationManager = require('../helpers/notificationManager');
const _ = require('lodash');
const { formatTags } = require('../helpers/formatters');
const config = require('../config/options');

const LIMIT = 15;

// Schema.Types vs mongoose.Types: https://github.com/Automattic/mongoose/issues/1671
// Subdocs: http://mongoosejs.com/docs/subdocs.html
const PollSchema = new Schema({
  choices: [new Schema({
    text: {type: String},
    votes: [{type: String}]
  }, { timestamps: true })],
  isMultiSelect: {
    type: Boolean,
    required: true,
	}
}, { timestamps: true });

PollSchema.statics.create = function(poll) {
	return new Promise((resolve, reject) => {
		const newPoll = new this(poll);
		newPoll.save().then(poll => {
			resolve(poll);
		})
		.catch(err => {
			reject(err);
		});
	});
}

mongoose.model('Poll', PollSchema);