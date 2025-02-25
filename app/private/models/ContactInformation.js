const fs = require('fs').promises;
const path = './private/data/contact-info.json';

/**
 * Updates contact information in a JSON file
 * @param {string} number - The phone number to update
 * @param {string} email - The email address to update
 * @returns {undefined}
 */
async function updateContactInfo(number, email) {
	
	try {
	
		// Read the existing data from file
		const data = await fs.readFile(path, 'utf-8');
		
		// Parse the JSON string into an object
		const contactInfo = JSON.parse(data);
		
		// Update the contact information
		contactInfo.number = number;
		contactInfo.email = email;
		
		// Write the updated object back to file (formatted with 2 spaces indentation)
		await fs.writeFile(path, JSON.stringify(contactInfo, null, 2));
	
	} catch (error) {
	
		// Log any errors that occur during the process
		console.error('Error updating contact info:', error);
	
	}

};

/**
 * Retrieves contact information from a JSON file
 * @returns {Object|undefined} - Object containing contact info or undefined if an error occurs
 */
async function getContactInfo(number, email) {
	
	try {
	
		// Read data from file
		const data = await fs.readFile(path, 'utf-8');
		
		// Parse the JSON string into an object
		const contactInfo = JSON.parse(data);
		
		// Return only the number and email properties
		return { 
	
			number: contactInfo.number,
			email: contactInfo.email
		
		};
	
	} catch (error) {
	
		// Log any errors that occur during the process
		console.error('Error getting contact info:', error);
	
	}

};

module.exports = { updateContactInfo, getContactInfo };