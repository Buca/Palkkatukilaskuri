const express = require('express');
const router = express.Router();
const { updateContactInfo } = require('../models/ContactInformation');

router.post("/", (req, res) => {

	const isAuthenticated = req.session.isAuthenticated;
	const { number, email } = req.body;

	try {

		if ( isAuthenticated ) {

			updateContactInfo( number, email );

			res.json({
				
				success: true,
				message: "Yhteistietojen päivittäminen onnistui."

			});

		} else {

			res.json({

				success: false,
				message: "Sisään kirjautuminen epäonnistui. Yritä uudelleen." 
			
			});
			
		}

	} catch ( err ) {

		res.json({

			success: false, 
			message: "Yhteistietojen päivittäminen epäonnistui sisäisen palvelinvirheen takia." 
		
		});

	}

});

module.exports = router;