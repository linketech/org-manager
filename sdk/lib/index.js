let Parse

if (typeof XMLHttpRequest !== 'undefined') {
	// For browsers
	Parse = require('parse') /* eslint-disable-line global-require */
} else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
	// For node
	Parse = require('parse/node') /* eslint-disable-line global-require */
}

const Organization = new Parse.Object('Organization')

async function isLogin() {
	const user = await Parse.User.currentAsync()
	if (!user) {
		throw new Error('need login')
	}
	return user
}

async function create(name) {
	const currentUser = await isLogin()

	if (!name) {
		throw new Error('need organization name')
	}

	const org = Organization
	org.set('name', name)
	org.set('createdBy', currentUser)
	const orgACL = new Parse.ACL()
	orgACL.setReadAccess(currentUser, true)
	orgACL.setWriteAccess(currentUser, true)
	org.setACL(orgACL)
	const newOrg = await org.save()

	const grantRoleACL = new Parse.ACL()
	grantRoleACL.setReadAccess(currentUser, true)
	grantRoleACL.setWriteAccess(currentUser, true)
	const grantRole = new Parse.Role('GRANT', grantRoleACL)
	grantRole.set('organization', org)
	const newGrantRole = await grantRole.save()

	const readRoleACL = new Parse.ACL()
	readRoleACL.setReadAccess(currentUser, true)
	readRoleACL.setWriteAccess(currentUser, true)
	readRoleACL.setRoleReadAccess(newGrantRole, true)
	readRoleACL.setRoleWriteAccess(newGrantRole, true)
	const readRole = new Parse.Role('READ', readRoleACL)
	readRole.set('organization', org)

	const writeRoleACL = new Parse.ACL()
	writeRoleACL.setReadAccess(currentUser, true)
	writeRoleACL.setWriteAccess(currentUser, true)
	writeRoleACL.setRoleReadAccess(newGrantRole, true)
	writeRoleACL.setRoleWriteAccess(newGrantRole, true)
	const writeRole = new Parse.Role('WRITE', writeRoleACL)
	writeRole.set('organization', org)

	const [newReadRole, newWriteRole] = await Promise.all([
		readRole.save(),
		writeRole.save(),
	])

	const newOrgACL = await newOrg.getACL()
	newOrgACL.setRoleReadAccess(newReadRole, true)
	newOrgACL.setRoleWriteAccess(newWriteRole, true)
	newOrg.setACL(newOrgACL)
	await newOrg.save()

	return newOrg
}

async function before_invite_or_remove(orgName, userName) {
	await isLogin()

	const queryOrg = new Parse.Query(Organization)
	queryOrg.equalTo('name', orgName)
	const organization = await queryOrg.first()
	if (!organization) {
		throw new Error('organization not found')
	}

	const queryUser = new Parse.Query(new Parse.User())
	queryUser.equalTo('username', userName)
	const user = await queryUser.first()
	if (!user) {
		throw new Error('user not found')
	}

	return [organization, user]
}

async function invite(orgName, userName) {
	const [organization, user] = await before_invite_or_remove(orgName, userName)

	const members = organization.relation('members')
	members.add(user)

	const queryRole = new Parse.Query(new Parse.Role())
	queryRole.equalTo('organization', organization)
	queryRole.equalTo('name', 'READ')
	const readRole = await queryRole.first()
	if (!readRole) {
		throw new Error('role not found')
	}
	readRole.getUsers().add(user)

	await Promise.all([
		organization.save(),
		readRole.save(),
	])
}

async function remove(orgName, userName) {
	const [organization, user] = await before_invite_or_remove(orgName, userName)

	const members = organization.relation('members')
	members.remove(user)

	const queryRole = new Parse.Query(new Parse.Role())
	queryRole.equalTo('organization', organization)
	const roles = await queryRole.find()
	if (!(roles && roles.length > 0)) {
		throw new Error('role not found')
	}
	await Promise.all([
		organization.save(),
		...roles.map((role) => {
			role.getUsers().remove(user)
			return role.save()
		})])
}

module.exports = {
	Organization: {
		create,
		invite,
		remove,
	},
}
