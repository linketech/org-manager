const { Parse, isLogin } = require('./Base')

const { Organization } = require('./Organization')

const Project = Parse.Object.extend('Project')

async function create(orgName, projectName) {
	const currentUser = await isLogin()

	if (!orgName) {
		throw new Error('need organization name')
	}
	const queryOrg = new Parse.Query(Organization)
	queryOrg.equalTo('name', orgName)
	const organization = await queryOrg.first()
	if (!organization) {
		throw new Error('organization not found')
	}

	const createdByUser = organization.get('createdBy')
	if (!createdByUser) {
		throw new Error('created user not found')
	}

	let project = new Project()
	project.set('name', projectName)
	project.set('organization', organization)
	project.set('createdBy', currentUser)
	project = await project.save()

	const grantRoleACL = new Parse.ACL(currentUser)
	const grantRoleName = `O_${organization.id}_P_${project.id}_GRANT`
	grantRoleACL.setRoleReadAccess(grantRoleName, true)
	grantRoleACL.setReadAccess(createdByUser, true)
	grantRoleACL.setWriteAccess(createdByUser, true)
	const grantRole = new Parse.Role(grantRoleName, grantRoleACL)
	grantRole.set('project', project)
	grantRole.set('organization', organization)
	grantRole.set('action', 'GRANT')
	await grantRole.save()

	const readRoleACL = new Parse.ACL(currentUser)
	const readRoleName = `O_${organization.id}_P_${project.id}_READ`
	readRoleACL.setPublicReadAccess(true)
	readRoleACL.setReadAccess(createdByUser, true)
	readRoleACL.setWriteAccess(createdByUser, true)
	readRoleACL.setRoleReadAccess(grantRoleName, true)
	readRoleACL.setRoleWriteAccess(grantRoleName, true)
	const readRole = new Parse.Role(readRoleName, readRoleACL)
	readRole.set('project', project)
	readRole.set('organization', organization)
	readRole.set('action', 'READ')
	await readRole.save()

	const writeRoleACL = new Parse.ACL(currentUser)
	const writeRoleName = `O_${organization.id}_P_${project.id}_WRITE`
	writeRoleACL.setPublicReadAccess(true)
	writeRoleACL.setReadAccess(createdByUser, true)
	writeRoleACL.setWriteAccess(createdByUser, true)
	writeRoleACL.setRoleReadAccess(grantRoleName, true)
	writeRoleACL.setRoleWriteAccess(grantRoleName, true)
	const writeRole = new Parse.Role(writeRoleName, writeRoleACL)
	writeRole.set('project', project)
	writeRole.set('organization', organization)
	writeRole.set('action', 'WRITE')
	await writeRole.save()

	const projectACL = new Parse.ACL(currentUser)
	projectACL.setReadAccess(createdByUser, true)
	projectACL.setWriteAccess(createdByUser, true)
	projectACL.setRoleReadAccess(readRoleName, true)
	projectACL.setRoleWriteAccess(writeRoleName, true)
	project.setACL(projectACL)

	return project.save()
}

async function before_invite_or_remove(orgName, projectName, userName) {
	await isLogin()

	const queryOrg = new Parse.Query(Organization)
	queryOrg.equalTo('name', orgName)
	const organization = await queryOrg.first()
	if (!organization) {
		throw new Error('organization not found')
	}

	const queryPro = new Parse.Query(Project)
	queryPro.equalTo('organization', organization)
	queryPro.equalTo('name', projectName)
	const project = await queryPro.first()
	if (!project) {
		throw new Error('project not found')
	}

	const queryUser = new Parse.Query(new Parse.User())
	queryUser.equalTo('username', userName)
	const user = await queryUser.first()
	if (!user) {
		throw new Error('user not found')
	}

	const organizationMembersQuery = await organization.relation('members').query()
	organizationMembersQuery.equalTo('username', userName)
	const inOrganizationUser = await organizationMembersQuery.first()
	if (!inOrganizationUser) {
		throw new Error('user not in organiation')
	}

	return [project, user]
}

async function invite(orgName, projectName, userName) {
	const [project, user] = await before_invite_or_remove(orgName, projectName, userName)

	const members = project.relation('members')
	members.add(user)
	await project.save()

	const queryRole = new Parse.Query(new Parse.Role())
	queryRole.equalTo('project', project)
	queryRole.equalTo('action', 'READ')
	const readRole = await queryRole.first()
	if (!readRole) {
		throw new Error('role not found')
	}
	readRole.getUsers().add(user)
	await readRole.save()
}

async function remove(orgName, projectName, userName) {
	const [project, user] = await before_invite_or_remove(orgName, projectName, userName)

	const members = project.relation('members')
	members.remove(user)

	const queryRole = new Parse.Query(new Parse.Role())
	queryRole.equalTo('project', project)
	const roles = await queryRole.find()
	if (!(roles && roles.length > 0)) {
		throw new Error('role not found')
	}
	await Promise.all([
		project.save(),
		...roles.map((role) => {
			role.getUsers().remove(user)
			return role.save()
		})])
}

module.exports = {
	Project,
	create,
	invite,
	remove,
}
