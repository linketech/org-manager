const Parse = require('parse/node')

const { port, appId, javascriptKey } = require('../config')
const mongoUtilFactory = require('../mongoUtil')
const sdk = require('../../lib')

Parse.initialize(appId, javascriptKey)
Parse.serverURL = `http://localhost:${port}/parse`
Parse.User.enableUnsafeCurrentUser()

const mongoUtil = mongoUtilFactory()

async function before() {
	await mongoUtil.connect()
	if (!await mongoUtil.isEmpty()) {
		await mongoUtil.close()
		throw new Error('警告：不应该在非空的数据库中测试')
	}

	Parse.initialize(appId, javascriptKey)
	Parse.serverURL = `http://localhost:${port}/parse`
	Parse.User.enableUnsafeCurrentUser()
}

async function after() {
	await mongoUtil.clear()
	await mongoUtil.close()
}

async function main() {
	const user = await sdk.signUp('ivan', '111111', {
		email: '43811702@qq.com',
		phone: '13798988787',
	})
	console.log(user)

	const currentUser = await sdk.current()
	console.log(currentUser)

	const sueOrganization = await sdk.Organization.create('Sun')

	console.log(sueOrganization)

	const queryOrganization = await sdk.Organization.list()

	console.log(queryOrganization)
}

// (async () => {
// 	try {
// 		await after()
// 		await main()
// 	} catch (err) {
// 		console.error(err)
// 	}
// })()
