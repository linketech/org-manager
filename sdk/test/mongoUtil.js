// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb')

module.exports = (url, options) => {
	const client = new MongoClient(url, options)

	let isConnected = false

	async function connect() {
		if (!isConnected) {
			await client.connect()
			isConnected = true
		}
	}

	async function close() {
		if (isConnected) {
			await client.close()
			isConnected = false
		}
	}

	async function isEmpty() {
		// TODO 应该检查DB是否存在
		const dbInstance = client.db()
		const stats = await dbInstance.stats()
		if (stats) {
			if (stats.collections === 0) {
				return true
			}
		}
		return false
	}

	async function clear() {
		await client.db().dropDatabase()
	}

	return {
		connect,
		close,
		isEmpty,
		clear,
	}
}
