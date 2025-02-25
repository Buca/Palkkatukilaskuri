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

// Route to display the login page
router.get('/login', async (req, res) => {

	const isAuthenticated = req.session.isAuthenticated; // Check if the user is already authenticated

	if ( isAuthenticated ) {

		res.redirect('/hallinta'); // Redirect authenticated users to the admin panel

	} else {

		// Fetch necessary data for rendering the login page
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		res.render('login', {
		
			isAuthenticated, // Pass authentication status
			contactInfo, // Pass contact information
			firstLevelOfPages // Pass top-level pages for navigation
		
		});

	}

});


// Route to handle login form submission
router.post('/login', loginRateLimiter, async (req, res) => {

	const { username, password } = req.body; // Extract username and password from request body

	try {

		// Validate user credentials against the database
		const hasValidUserCredentials = await validateUserCredentials( username, password );

		if ( hasValidUserCredentials ) {
			
			req.session.isAuthenticated = true; // Set session authentication flag
			res.json({ 
				success: true // Send success response
			});

		} else {

			res.json({ 
				success: false, 
				message: "Sisään kirjautuminen epäonnistui. Yritä uudelleen." // Send failure message
			});
			
		}

	} catch ( err ) {

		// Handle any unexpected server errors
		res.json({ success: false, message: 'Sisään kirjautuminen epäonnistui sisäisen palvelinvirheen takia.' });

	}

});


// Route to handle logout
router.get("/logout", (req, res, next) => {
	
	req.session.destroy( (error) => {
		
		if (error) { 

			next( error ); // Pass error to the next middleware
		
		}

    	res.redirect("/login"); // Redirect to login page after logout

	});

});


module.exports = router;