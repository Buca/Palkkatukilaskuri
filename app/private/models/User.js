const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const CLIENT_USERNAME = process.env.CLIENT_USERNAME;
const CLIENT_HASHED_PASSWORD = process.env.CLIENT_HASHED_PASSWORD;


/**
 * Validates user credentials against stored values
 * @param {string} username - The username to validate
 * @param {string} password - The password to validate
 * @returns {boolean} - True if credentials are valid, false otherwise
 */
async function validateUserCredentials(username, password) {
	
	try {
			
		// First check if username matches the stored username
		if(username !== CLIENT_USERNAME) return false; 
		
		// Compare the provided password with the stored hashed password
		const match = await bcrypt.compare(password, CLIENT_HASHED_PASSWORD);
		return match; // Returns true if the password matches, false otherwise
	
	} catch (error) {
	
		// Return false for any errors during validation
		return false; // Return false on error
	
	}

};


module.exports = { validateUserCredentials };