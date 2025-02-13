const express = require('express');
const router = express.Router();
const { getPageById, editPageById, removePageById, createPage, getBreadcrumbsById, getFirstLevelOfPages, movePageUp, movePageDown } = require('../models/Page');
const { getContactInfo } = require('../models/ContactInformation');

router.get("/:id", async (req, res, next) => {

	try {

		const pageId = req.params.id;
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		const page = await getPageById(pageId);
		const breadcrumbs = await getBreadcrumbsById(pageId);

		if (!page) return next();

		res.render("page", { 

			page, 
			isAuthenticated, 
			contactInfo, 
			breadcrumbs,
			firstLevelOfPages

		});

	} catch (error) {

		next(error);

	}

});

router.get("/juuri/uusi", async (req, res, next) => {
	
	try {

		const parentId = req.params.parentId || null; // Handle root-level pages
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();

		if ( isAuthenticated ) {

			const breadcrumbs = await getBreadcrumbsById(parentId);

			res.render("create-page", {

				isAuthenticated,
				contactInfo,
				parentId,
				breadcrumbs,
				firstLevelOfPages
			
			});

		} else {

			res.redirect('/../login');

		}

	} catch (error) {

		next(error);
	
	}

});

router.post("/juuri/uusi", async (req, res, next) => {

	try {

		const { title, html } = req.body;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
		
			return res.redirect("/../login"); // Redirect to login if not authenticated
		
		}

		const page = await createPage(title, html, null);

		res.json({

			success: true
		
		});
	
	} catch (error) {

		next(error);
	
	}


});

router.get("/:parentId?/uusi", async (req, res, next) => {
	
	try {

		const parentId = req.params.parentId; // Handle root-level pages
		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo();
		const firstLevelOfPages = await getFirstLevelOfPages();
		let breadcrumbs;

		if ( isAuthenticated ) {

			let parentPage = null;
			if (parentId) {
			
				parentPage = await getPageById(parentId);
				breadcrumbs = await getBreadcrumbsById(parentId);
			
				if (!parentPage) {
					return next();
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

			res.redirect('/../login');

		}

	} catch (error) {

		next(error);
	
	}

});

router.post("/:parentId?/uusi", async (req, res, next) => {

	try {

		const { title, html } = req.body;
		const parentId = req.params.parentId;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
		
			return res.redirect("/../login"); // Redirect to login if not authenticated
		
		}

		const newPage = await createPage(title, html, parentId);
	
		res.json({
			success: true
		});
	
	} catch (error) {

		next(error);
	
	}

});

router.get("/:id/muokkaa", async (req, res, next) => {
	
	try {
	
		const pageId = req.params.id;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
			return res.redirect("/../login");
		}

		const page = await getPageById(pageId);
		const contactInfo = await getContactInfo();
		const breadcrumbs = await getBreadcrumbsById(pageId);
		const firstLevelOfPages = await getFirstLevelOfPages();

		if (!page) {
			return next();
		}

		res.render("edit-page", { 
			
			page, 
			isAuthenticated, 
			contactInfo, 
			breadcrumbs,
			firstLevelOfPages

		});
	
	} catch (error) {

		next(error);
	
	}

});

router.post("/:id/muokkaa", async (req, res, next) => {
	
	try {

		const pageId = req.params.id;
		const { title, html } = req.body;
		const isAuthenticated = req.session.isAuthenticated;

		if (!isAuthenticated) {
			return res.redirect("/../login");
		}

		const updatedPage = await editPageById( pageId, title, html );

		if (!updatedPage) {
			next();
		}

		res.json({ success: true, message: "Sivun päivitys onnistui." });

	} catch (error) {
	
		next(error);
	
	}

});

router.post("/:id/poista", async (req, res, next) => {
	
	try {

		const pageId = req.params.id;

		// Check if the page exists
		const page = await getPageById(pageId);

		if (!page) {

			next();
		
		}

		// Delete the page and all its descendants
		const deletedPages = await removePageById(pageId);

		res.json({ success: true, message: "Sivu poistettu onnistuneesti", deletedPages });

	} catch (error) {
	
		next(error);
	
	}

});

router.post("/reorder", async (req, res) => {

    const { pageId, direction } = req.body;
    const isAuthenticated = req.session.isAuthenticated;

    try {
    	
    	if (!isAuthenticated) {
			return res.json({ success: false });
		}

    	if ( direction === "up" ) await movePageUp( pageId );
    	else if ( direction === "down" ) await movePageDown( pageId );

        res.json({ success: true });
    
    } catch (error) {
    
        next( error );
    
    }

});

module.exports = router;