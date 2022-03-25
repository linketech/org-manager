const express = require('express')
const { ParseServer } = require('parse-server')
const ParseDashboard = require('parse-dashboard')
const config = require('../config')

const fileKey = 'FILE_KEY'
const masterKey = 'MASTER_KEY'
const { port, appId, javascriptKey, databaseURI, databaseOptions } = config
const serverURL = `http://localhost:${port}/parse`

const app = express()

const api = new ParseServer({
	databaseURI,
	databaseOptions,
	appId,
	fileKey,
	javascriptKey,
	masterKey,
	serverURL,
})

const dashboard = new ParseDashboard({
	apps: [
		{
			serverURL,
			appId,
			masterKey,
			appName: 'cloud-production',
		},
	],
}, {
	allowInsecureHTTP: true,
})

app.use('/parse', api)
app.use('/dashboard', dashboard)

app.listen(port, (err) => {
	if (err) {
		console.error(err)
		return
	}
	console.log(`parse-server-example running on port ${port}.`)
})
