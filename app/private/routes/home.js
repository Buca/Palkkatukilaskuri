const express = require('express');
const router = express.Router();
const { getFirstLevelOfPages } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

router.get('/', async (req, res) => {
  
	try {
	    
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		// Render the 'home' view with the fetched article data
		res.render('home', { 

			firstLevelOfPages, 
			isAuthenticated, 
			contactInfo,
			firstLevelOfPages
		
		});
	
	} catch (error) {
		
		next( error );
	
	}

});

module.exports = router;