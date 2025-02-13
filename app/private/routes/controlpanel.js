const express = require('express');
const router = express.Router();
const { getAllPages, getFirstLevelOfPages } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

router.get('/', async (req, res, next) => {
	
	const isAuthenticated = req.session.isAuthenticated;

	if (isAuthenticated) {
	
		try {
	
			const contactInfo = await getContactInfo();
			const pages = await getAllPages();
			const firstLevelOfPages = await getFirstLevelOfPages();

			res.render('controlpanel', { 

				isAuthenticated, 
				contactInfo, 
				pages,
				firstLevelOfPages
			});
		
		} catch (error) {
			
			next(error);
		}

	} else {
		
		// Redirect unauthenticated users to the login page
		res.redirect('/../login');
	
	}

});

module.exports = router;