const express = require('express');
const router = express.Router();
const { getAllPages, getFirstLevelOfPages } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

// Route to render the control panel for authenticated users
router.get('/', async (req, res, next) => {
	
	const isAuthenticated = req.session.isAuthenticated; // Check if the user is authenticated

	if (isAuthenticated) { 
	
		try {
	
			const contactInfo = await getContactInfo(); // Fetch contact details
			const pages = await getAllPages(); // Retrieve all pages
			const firstLevelOfPages = await getFirstLevelOfPages(); // Get top-level pages

			// Render the control panel view with fetched data
			res.render('controlpanel', { 
				
				isAuthenticated, 
				contactInfo, 
				pages,
				firstLevelOfPages
			
			});
		
		} catch (error) {
			
			next(error); // Pass any errors to the error handler
		}

	} else {
		
		// Redirect unauthenticated users to the login page
		res.redirect('/../login');
	
	}

});


module.exports = router;