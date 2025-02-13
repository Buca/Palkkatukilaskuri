const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const CLIENT_USERNAME = process.env.CLIENT_USERNAME;
const CLIENT_HASHED_PASSWORD = process.env.CLIENT_HASHED_PASSWORD;


async function validateUserCredentials( username, password ) {
	
	try {
			
		if( username !== CLIENT_USERNAME ) return false; 

		const match = await bcrypt.compare(password, CLIENT_HASHED_PASSWORD);
		return match; // Returns true if the password matches, false otherwise
	
	} catch ( error ) {
	
		return false; // Return false on error
	
	}

};


module.exports = { validateUserCredentials };