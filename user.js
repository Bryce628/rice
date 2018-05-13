var mongoose = require('mongoose');

var model = mongoose.model('user', new mongoose.Schema({
	username: {type: String, unique: true}
	, age: {type: String}
	, email: {type: String, unique: true}
	, password: {type: String}
	, salt: {type: String}
	, avatar: {type: String}
}));

exports.getModel = function() {
	return model;
}
