/* eslint-env mocha */
const { expect } = require('chai')// eslint-disable-line import/no-extraneous-dependencies
const Parse = require('parse/node')
const mongoUtilFactory = require('../mongoUtil')

const sdk = require('../../lib')

const { port, appId, javascriptKey, databaseURI, databaseOptions } = require('../../../config')

describe('Core', () => {
	Parse.initialize(appId, javascriptKey)
	Parse.serverURL = `http://localhost:${port}/parse`
	Parse.User.enableUnsafeCurrentUser()

	const mongoUtil = mongoUtilFactory(databaseURI, databaseOptions)

	before(async () => {
		await mongoUtil.connect()
		// if (!await mongoUtil.isEmpty()) {
		//   await mongoUtil.close()
		//   throw new Error('警告：不应该在非空的数据库中测试')
		// }
		await mongoUtil.clear()
	})

	after(async () => {
		// await mongoUtil.clear()
		await mongoUtil.close()
	})

	describe('Organization', () => {
		it('注册ivan', async () => {
			const user = await Parse.User.signUp('ivan', '111111', {
				email: '43811702@qq.com',
				phone: '13798988787',
			})
			// ParseUser { _objCount: 1, className: '_User', id: 'ABU11AYPUC' }
			// console.log(user)
			expect(user).to.be.an('object')
			expect(user).to.have.a.property('_objCount')
			expect(user).to.have.a.property('className')
			expect(user.className).to.eql('_User')
			expect(user).to.have.a.property('id')
		})

		it('注册tom', async () => {
			const user = await Parse.User.signUp('tom', '111111', {
				email: '43811702-02@qq.com',
				phone: '13798988787-02',
			})
			// ParseUser { _objCount: 1, className: '_User', id: 'ABU11AYPUC' }
			// console.log(user)
			expect(user).to.be.an('object')
			expect(user).to.have.a.property('_objCount')
			expect(user).to.have.a.property('className')
			expect(user.className).to.eql('_User')
			expect(user).to.have.a.property('id')
		})

		it('注册jack', async () => {
			const user = await Parse.User.signUp('jack', '111111', {
				email: '43811702-03@qq.com',
				phone: '13798988787-03',
			})
			// ParseUser { _objCount: 1, className: '_User', id: 'ABU11AYPUC' }
			// console.log(user)
			expect(user).to.be.an('object')
			expect(user).to.have.a.property('_objCount')
			expect(user).to.have.a.property('className')
			expect(user.className).to.eql('_User')
			expect(user).to.have.a.property('id')
		})

		it('ivan创建Organization', async () => {
			await Parse.User.logIn('ivan', '111111')

			const organization = await sdk.Organization.create('Sun')
			// ParseObject { _objCount: 2, className: 'Organization', id: 'EZvwLG54rM' }
			// console.log(newOrganization)
			expect(organization).to.be.an('object')
			expect(organization).to.have.a.property('_objCount')
			expect(organization).to.have.a.property('className')
			expect(organization.className).to.eql('Organization')
			expect(organization).to.have.a.property('id')
		})

		const Organization = new Parse.Object('Organization')

		it('ivan访问Organiation -> 访问成功', async () => {
			await Parse.User.logIn('ivan', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			// console.log(`${result.id} - ${result.get('name')}`)
			expect(result).to.be.an('object')
			expect(result).to.have.a.property('_objCount')
			expect(result).to.have.a.property('className')
			expect(result.className).to.eql('Organization')
			expect(result).to.have.a.property('id')
			expect(result.get('name')).to.eql('Sun')
		})

		it('tom访问Organiation -> 访问不成功', async () => {
			await Parse.User.logIn('tom', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			expect(result).to.be.an('undefined')
		})

		it('ivan邀请tom进Organiation', async () => {
			await Parse.User.logIn('ivan', '111111')
			await sdk.Organization.invite('Sun', 'tom')
		})

		it('tom访问Organiation -> 访问成功', async () => {
			await Parse.User.logIn('tom', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			// console.log(`${result.id} - ${result.get('name')}`)
			expect(result).to.be.an('object')
			expect(result).to.have.a.property('_objCount')
			expect(result).to.have.a.property('className')
			expect(result.className).to.eql('Organization')
			expect(result).to.have.a.property('id')
			expect(result.get('name')).to.eql('Sun')
		})

		it('jack访问Organiation -> 访问不成功', async () => {
			await Parse.User.logIn('jack', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			expect(result).to.be.an('undefined')
		})

		it('ivan邀请jack进Organiation', async () => {
			await Parse.User.logIn('ivan', '111111')
			await sdk.Organization.invite('Sun', 'jack')
		})

		it('jack访问Organiation -> 访问成功', async () => {
			await Parse.User.logIn('jack', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			// console.log(`${result.id} - ${result.get('name')}`)
			expect(result).to.be.an('object')
			expect(result).to.have.a.property('_objCount')
			expect(result).to.have.a.property('className')
			expect(result.className).to.eql('Organization')
			expect(result).to.have.a.property('id')
			expect(result.get('name')).to.eql('Sun')
		})

		it('ivan查看Organiation的成员', async () => {
			await Parse.User.logIn('ivan', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(`${result.id} - ${result.get('name')}`)
			expect(result).to.be.an('object')
			expect(result).to.have.a.property('_objCount')
			expect(result).to.have.a.property('className')
			expect(result.className).to.eql('Organization')
			expect(result).to.have.a.property('id')
			expect(result.get('name')).to.eql('Sun')

			const queryMembers = result.get('members').query()
			queryMembers.addAscending('username')
			const members = await queryMembers.find()
			expect(members).to.be.an('array')
			expect(members.length).to.eql(2)
			expect(members[0].get('username')).to.eql('jack')
			expect(members[1].get('username')).to.eql('tom')
		})

		it('ivan将tom移出Organiation', async () => {
			await Parse.User.logIn('ivan', '111111')
			await sdk.Organization.remove('Sun', 'tom')
		})

		it('tom访问Organiation -> 访问不成功', async () => {
			await Parse.User.logIn('tom', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			expect(result).to.be.an('undefined')
		})

		it('ivan将jack移出Organiation', async () => {
			await Parse.User.logIn('ivan', '111111')
			await sdk.Organization.remove('Sun', 'jack')
		})

		it('jack访问Organiation -> 访问不成功', async () => {
			await Parse.User.logIn('jack', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(result)
			expect(result).to.be.an('undefined')
		})

		it('ivan查看Organiation的成员', async () => {
			await Parse.User.logIn('ivan', '111111')

			const query = new Parse.Query(Organization)
			const result = await query.first()
			// console.log(`${result.id} - ${result.get('name')}`)
			expect(result).to.be.an('object')
			expect(result).to.have.a.property('_objCount')
			expect(result).to.have.a.property('className')
			expect(result.className).to.eql('Organization')
			expect(result).to.have.a.property('id')
			expect(result.get('name')).to.eql('Sun')

			const queryMembers = result.get('members').query()
			queryMembers.addAscending('username')
			const members = await queryMembers.find()
			expect(members).to.be.an('array')
			expect(members.length).to.eql(0)
		})
	})
})
