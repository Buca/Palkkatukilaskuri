const express = require('express');
const router = express.Router();
const { getPageById, editPageById, removePageById, createPage, getBreadcrumbsById, getFirstLevelOfPages, movePageUp, movePageDown } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

// Route to retrieve a specific page by its ID
router.get("/:id", async (req, res, next) => {

	try {

		const pageId = req.params.id; // Get the page ID from URL parameters
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		// Fetch the page details and breadcrumb navigation
		const page = await getPageById(pageId);
		const breadcrumbs = await getBreadcrumbsById(pageId);

		// If the page doesn't exist, pass control to the next middleware (404 handler)
		if (!page) return next();

		// Render the page template with required data
		res.render("page", { 
			
			page, 
			isAuthenticated, 
			contactInfo, 
			breadcrumbs,
			firstLevelOfPages
		
		});

	} catch (error) {

		next(error); // Handle errors

	}

});


// Route to display the "Create New Page" form at the root level
router.get("/juuri/uusi", async (req, res, next) => {
	
	try {

		const parentId = req.params.parentId || null; // Handle root-level pages
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		if ( isAuthenticated ) {

			const breadcrumbs = await getBreadcrumbsById(parentId); // Get breadcrumbs for navigation

			res.render("create-page", {
				
				isAuthenticated,
				contactInfo,
				parentId,
				breadcrumbs,
				firstLevelOfPages
			
			});

		} else {

			res.redirect('/../login'); // Redirect unauthorized users to login

		}

	} catch (error) {

		next(error); // Handle errors
	
	}

});


// Route to handle form submission for creating a new root-level page
router.post("/juuri/uusi", async (req, res, next) => {

	try {

		const { title, html } = req.body;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
		
			return res.redirect("/../login"); // Redirect if not authenticated
		
		}

		// Create a new page with no parent (root-level)
		const page = await createPage(title, html, null);

		res.json({
			
			success: true
		
		});
	
	} catch (error) {

		next(error); // Handle errors
	
	}

});


// Route to display "Create New Page" form under a specific parent
router.get("/:parentId?/uusi", async (req, res, next) => {
	
	try {

		const parentId = req.params.parentId; // Get parent ID from URL (if provided)
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();
		let breadcrumbs;

		if ( isAuthenticated ) {

			let parentPage = null;
			if (parentId) {
				
				// Fetch parent page and its breadcrumbs
				parentPage = await getPageById(parentId);
				breadcrumbs = await getBreadcrumbsById(parentId);
			
				if (!parentPage) {
				
					return next(); // Parent page not found, trigger 404 handler
				
				}

			}

			res.render("create-page", {
				
				isAuthenticated,
				contactInfo,
				breadcrumbs,
				parentId,
				firstLevelOfPages
			
			});

		} else {

			res.redirect('/../login'); // Redirect unauthorized users

		}

	} catch (error) {

		next(error); // Handle errors
	
	}

});


// Route to handle form submission for creating a new page under a parent
router.post("/:parentId?/uusi", async (req, res, next) => {

	try {

		const { title, html } = req.body;
		const parentId = req.params.parentId;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
			
			return res.redirect("/../login"); // Redirect if not authenticated
		
		}

		// Create a new page with the given parent ID
		const newPage = await createPage(title, html, parentId);
	
		res.json({ success: true });

	} catch (error) {

		next(error); // Handle errors
	
	}

});


// Route to display the "Edit Page" form for a specific page
router.get("/:id/muokkaa", async (req, res, next) => {
	
	try {
	
		const pageId = req.params.id;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
			return res.redirect("/../login"); // Redirect if not authenticated
		}

		// Fetch page details and related data
		const page = await getPageById(pageId);
		const contactInfo = await getContactInfo();
		const breadcrumbs = await getBreadcrumbsById(pageId);
		const firstLevelOfPages = await getFirstLevelOfPages();

		if (!page) {
		
			return next(); // Page not found, trigger 404 handler
		
		}

		// Render edit page template
		res.render("edit-page", { 
		
			page, 
			isAuthenticated, 
			contactInfo, 
			breadcrumbs,
			firstLevelOfPages
		
		});
	
	} catch (error) {

		next(error); // Handle errors
	
	}

});


// Route to handle form submission for editing an existing page
router.post("/:id/muokkaa", async (req, res, next) => {
	
	try {

		const pageId = req.params.id;
		const { title, html } = req.body;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
			return res.redirect("/../login"); // Redirect if not authenticated
		}

		// Update the page with new content
		const updatedPage = await editPageById(pageId, title, html);

		if (!updatedPage) {
			next(); // Page not found, trigger 404 handler
		}

		res.json({ success: true, message: "Sivun päivitys onnistui." });

	} catch (error) {
	
		next(error); // Handle errors
	
	}

});


// Route to handle page deletion
router.post("/:id/poista", async (req, res, next) => {
	
	try {

		const pageId = req.params.id;

		// Check if the page exists before deletion
		const page = await getPageById(pageId);

		if (!page) {

			next(); // Page not found, trigger 404 handler
		
		}

		// Delete the page and its subpages
		const deletedPages = await removePageById(pageId);

		res.json({ success: true, message: "Sivu poistettu onnistuneesti", deletedPages });

	} catch (error) {
	
		next(error); // Handle errors
	
	}

});


// Route to reorder pages (move up/down in navigation)
router.post("/reorder", async (req, res, next) => {

	const { pageId, direction } = req.body;
	const isAuthenticated = req.session.isAuthenticated;

	try {
		
		if (!isAuthenticated) {

			return res.json({ success: false });
		
		}

		// Move the page up or down based on the given direction
		if ( direction === "up" ) await movePageUp(pageId);
		else if ( direction === "down" ) await movePageDown(pageId);

		res.json({ success: true });
	
	} catch (error) {
	
		next(error); // Handle errors
	
	}

});

module.exports = router;