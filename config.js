module.exports = {
	port: 13370,
	appId: 'APP_ID',
	javascriptKey: 'JAVASCRIPT_KEY',
	databaseURI: 'mongodb://localhost:27017/parse-server',
	databaseOptions: {
		authSource: 'admin',
		auth: {
			username: 'root',
			password: 'root',
		},
	},
}
