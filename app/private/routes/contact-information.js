const express = require('express');
const router = express.Router();
const { updateContactInfo } = require('../models/ContactInformation');

// Route to update contact information
router.post("/", (req, res) => {

	const isAuthenticated = req.session.isAuthenticated; // Check if the user is authenticated
	const { number, email } = req.body; // Extract number and email from the request body

	try {

		if (isAuthenticated) {

			// Update contact information in the data/contact-info.json
			updateContactInfo(number, email);

			// Respond with a success message
			res.json({
		
				success: true,
				message: "Yhteystietojen päivittäminen onnistui."
		
			});

		} else {

			// Respond with an error message if the user is not authenticated
			res.json({

				success: false,
				message: "Sisään kirjautuminen epäonnistui. Yritä uudelleen." 
			
			});
			
		}

	} catch (err) {

		// Handle server errors and send an appropriate response
		res.json({
			
			success: false, 
			message: "Yhteystietojen päivittäminen epäonnistui sisäisen palvelinvirheen takia." 
		
		});

	}

});

module.exports = router;