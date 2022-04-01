let Parse

if (typeof XMLHttpRequest !== 'undefined') {
	// For browsers
	Parse = require('parse') /* eslint-disable-line global-require */
} else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
	// For node
	Parse = require('parse/node') /* eslint-disable-line global-require */
}

async function isLogin() {
	const user = await Parse.User.currentAsync()
	if (!user) {
		throw new Error('need login')
	}
	return user
}

module.exports = {
	Parse,
	isLogin,
}
