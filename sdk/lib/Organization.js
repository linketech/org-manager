const { Parse, isLogin } = require('./Base')

const Organization = Parse.Object.extend('Organization')

async function create(name) {
	const currentUser = await isLogin()

	if (!name) {
		throw new Error('need organization name')
	}

	let org = new Organization()
	org.set('name', name)
	org.set('createdBy', currentUser)
	org = await org.save()

	const grantRoleACL = new Parse.ACL(currentUser)
	const grantRoleName = `O_${org.id}_GRANT`
	grantRoleACL.setRoleReadAccess(grantRoleName, true)
	const grantRole = new Parse.Role(grantRoleName, grantRoleACL)
	grantRole.set('organization', org)
	grantRole.set('action', 'GRANT')
	await grantRole.save()

	const readRoleACL = new Parse.ACL(currentUser)
	const readRoleName = `O_${org.id}_READ`
	readRoleACL.setRoleReadAccess(readRoleName, true)
	readRoleACL.setRoleReadAccess(grantRoleName, true)
	readRoleACL.setRoleWriteAccess(grantRoleName, true)
	const readRole = new Parse.Role(readRoleName, readRoleACL)
	readRole.set('organization', org)
	readRole.set('action', 'READ')
	await readRole.save()

	const writeRoleACL = new Parse.ACL(currentUser)
	const writeRoleName = `O_${org.id}_WRITE`
	writeRoleACL.setRoleReadAccess(writeRoleName, true)
	writeRoleACL.setRoleReadAccess(grantRoleName, true)
	writeRoleACL.setRoleWriteAccess(grantRoleName, true)
	const writeRole = new Parse.Role(writeRoleName, writeRoleACL)
	writeRole.set('organization', org)
	writeRole.set('action', 'WRITE')
	await writeRole.save()

	const orgACL = new Parse.ACL(currentUser)
	orgACL.setRoleReadAccess(readRoleName, true)
	orgACL.setRoleWriteAccess(writeRoleName, true)
	org.setACL(orgACL)
	return org.save()
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
	await organization.save()

	const queryRole = new Parse.Query(new Parse.Role())
	queryRole.equalTo('organization', organization)
	queryRole.equalTo('action', 'READ')
	const readRole = await queryRole.first()
	if (!readRole) {
		throw new Error('role not found')
	}
	readRole.getUsers().add(user)
	await readRole.save()
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
	Organization,
	create,
	invite,
	remove,
}
