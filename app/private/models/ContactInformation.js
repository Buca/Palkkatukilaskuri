const fs = require('fs').promises;
const path = './private/data/contact-info.json';

async function updateContactInfo( number, email ) {

	try {

		const data = await fs.readFile(path, 'utf-8');
		const contactInfo = JSON.parse(data);

		contactInfo.number = number;
		contactInfo.email = email;

		await fs.writeFile(path, JSON.stringify(contactInfo, null, 2));

	} catch (error) {

		console.error('Error updating contact info:', error);

	}

};

async function getContactInfo( number, email ) {

	try {

		const data = await fs.readFile(path, 'utf-8');
		const contactInfo = JSON.parse(data);

		return { 

			number: contactInfo.number,
			email: contactInfo.email
		
		};

	} catch (error) {

		console.error('Error getting contact info:', error);

	}

};

module.exports = { updateContactInfo, getContactInfo };