const express = require('express');
const router = express.Router();
const { getFirstLevelOfPages } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

// Route to render the homepage
router.get('/', async (req, res, next) => {
  
	try {
		
		const isAuthenticated = req.session.isAuthenticated; // Check if the user is authenticated
		const contactInfo = await getContactInfo(); // Fetch contact details
		const firstLevelOfPages = await getFirstLevelOfPages(); // Get top-level pages

		// Render the 'home' view with the fetched data
		res.render('home', { 
		
			firstLevelOfPages, 
			isAuthenticated, 
			contactInfo,
			firstLevelOfPages // This appears twice; one instance can be removed
		
		});
	
	} catch (error) {
		
		next(error); // Pass any errors to the error handler
	
	}

});


module.exports = router;