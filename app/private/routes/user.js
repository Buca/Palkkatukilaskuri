const express = require('express');
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { getFirstLevelOfPages } = require('../models/Page');
const { validateUserCredentials } = require('../models/User');
const { getContactInfo } = require('../models/ContactInformation');

const loginRateLimiter = rateLimit({
	
	windowMs: 15 * 60 * 1000, 	// 15 minutes
	max: 20,					// Limit each IP to 20 login attempts per windowMs
	standardHeaders: false, 	// Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, 		// Disable the `X-RateLimit-*` headers
	
	handler: (req, res, next) => {

    	res.status(429).json({
    		success: false,
      		message: "Too many login attempts. Please try again later.",
      		retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000, // Retry time in seconds
    	});

  	}

});

router.get('/login', async (req, res) => {

	const isAuthenticated = req.session.isAuthenticated;

	if ( isAuthenticated ) {

		res.redirect('/hallinta');

	} else {

		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		res.render('login', {
		
			isAuthenticated,
			contactInfo,
			firstLevelOfPages
		
		});

	}

});


router.post('/login', loginRateLimiter, async (req, res) => {

	const { username, password } = req.body;

	try {

		const hasValidUserCredentials = await validateUserCredentials( username, password );

		if ( hasValidUserCredentials ) {
			
			req.session.isAuthenticated = true;
			res.json({ 
				success: true
			});

		} else {

			res.json({ 
				success: false, 
				message: "Sisään kirjautuminen epäonnistui. Yritä uudelleen." 
			});
			
		}

	} catch ( err ) {

		res.json({ success: false, message: 'Sisään kirjautuminen epäonnistui sisäisen palvelinvirheen takia.' });

	}

});


router.get("/logout", (req, res, next) => {
	
	req.session.destroy( (error) => {
		
		if (error) { 

			next( error );
		
		}

    	res.redirect("/login");

	});

});

module.exports = router;