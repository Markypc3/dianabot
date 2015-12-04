var fs = require('fs');

var queue;

function backup(queueArray) {
	fs.writeFile('./db.json', JSON.stringify({queue: queueArray}));
}

try {
	queue = JSON.parse(fs.readFileSync('./db.json', 'utf8')).queue;
} catch(e) {
	queue = [];
	backup(queue);
}

var prettyQueue = function() {
	var queueArray = queue.map(function(user) {
		return user.real_name;
	});
	return "Current queue is now: " + (queueArray.length ? queueArray.join(", ") : "empty");
};
module.exports = function(bot, taID, taID_two) {
	var dianabot = function(message, cb) {
		// the if/else if statements are for commands that don't rely
		// on the wording as much
		if (message.type === "message" && message.text !== undefined && message.text.indexOf(bot.mention) > -1) {
			if (message.text.indexOf("status") > -1) {
				bot.sendMessage(message.channel, prettyQueue());

			} else if (message.text.indexOf("queue me") > -1 || message.text.indexOf("q me") > -1) {
				// adding a user to the queue
				if (queue.filter(function(e) {return e.id === message.user}).length === 0) {
					bot.api("users.info", {user: message.user}, function(data) {
						queue.push(data.user);
						bot.sendMessage(message.channel, prettyQueue());
						backup(queue);
					});
				} else {
					bot.sendMessage(message.channel, "Already in queue. " + prettyQueue());
				}

			} else if (message.text.indexOf("remove me") > -1) {
				// removing a user
				var userToRemove = queue.filter(function(user) {return user.id === message.user});
				if (userToRemove.length) {
					queue.splice(queue.indexOf(userToRemove[0]), 1);
					bot.sendMessage(message.channel, ":wave: " + prettyQueue());
					backup(queue);
				}

			} else if (message.text.indexOf("next") > -1 && (message.user === taID || message.user === taID_two)) {
				// next student
				var currentStudent = queue.shift();
				if (currentStudent) {
					bot.sendMessage(message.channel, "Up now: <@" + currentStudent.id + "> -- " + prettyQueue());
					backup(queue);
				}

			} else if (message.text.indexOf("help") > -1) {
				// help message
				bot.sendMessage(message.channel, "All commands work only when you specifically mention me. Type `queue me` or `q me` to queue yourself and `status` to check current queue. Type `remove me` to remove yourself.")

			} else if ((message.text.indexOf("clear queue") > -1 || message.text.indexOf("clear q") > -1) && (message.user === taID || message.user === taID_two)) {
				queue = [];
				bot.sendMessage(message.channel, "Queue cleared");
				backup(queue);
			}
		} else if(message.type === "hello") {
			console.log("dianabot connected...");
		}
		cb(null, 'core-bot');
	};
	return dianabot;
};
