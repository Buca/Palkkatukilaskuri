const pool = require('../config/db');

/**
 * Retrieves all top-level pages (pages with no parent)
 * @returns {Array} Array of objects containing id and title of root pages
 */
async function getFirstLevelOfPages() {

	try {

		// Query to select only root-level pages (those with no parent)
		const query = `
			SELECT id, title
			FROM pages
			WHERE parent IS NULL
			ORDER BY position ASC;
		`;

		const { rows } = await pool.query(query);
		return rows;

	} catch (error) {

		console.error("Error fetching root pages:", error);
		throw error;

	}

};

/**
 * Creates a new page (article) in the database
 * @param {string} title - The title of the new page
 * @param {string} text - The content text of the new page
 * @param {number|null} parent - ID of the parent page, or null for root-level pages
 * @returns {Object} The newly created page object with all properties
 */
async function createPage(title, text, parent = null) {

	try {

		// Calculate the next position value for the new page
		// Works for both root pages and child pages by checking parent value
		const positionQuery = `
			SELECT COALESCE(MAX(position), 0) + 1 AS next_position 
			FROM pages 
			WHERE (parent = $1 OR (parent IS NULL AND $1 IS NULL));
		`;

		const { rows: positionRows } = await pool.query(positionQuery, [parent]);
		const nextPosition = positionRows[0].next_position;

		// Insert the new page with the calculated position
		const insertQuery = `
			INSERT INTO pages (title, text, parent, position)
			VALUES ($1, $2, $3, $4)
			RETURNING *;
		`;

		const values = [title, text, parent, nextPosition];
		const { rows } = await pool.query(insertQuery, values);
		return rows[0]; // Return the created page with its position

	} catch (error) {

		console.error('Error creating page:', error);
		throw error;

	}

};

/**
 * Updates a page's title and text by its ID
 * @param {number} id - The ID of the page to edit
 * @param {string} title - The new title for the page
 * @param {string} text - The new content text for the page
 * @returns {Object} The updated page object
 */
async function editPageById(id, title, text) {

	try {

		const query = `
			UPDATE pages
			SET title = $1, text = $2
			WHERE id = $3
			RETURNING *;
		`;

		const values = [title, text, id];
		const { rows } = await pool.query(query, values);
		return rows[0];

	} catch (error) {

		console.error('Error updating page:', error);
		throw error;

	}

};

/**
 * Removes a page and all its descendant pages, updating positions of siblings
 * @param {number} id - The ID of the page to remove
 * @returns {Array} Array of objects representing all deleted pages
 */
async function removePageById(id) {

	try {
		// First get the parent ID and position of the page to be deleted
		const parentQuery = `SELECT parent, position FROM pages WHERE id = $1`;
		const { rows: parentRows } = await pool.query(parentQuery, [id]);

		if (parentRows.length === 0) {
			throw new Error("Page not found");
		}

		const { parent: parentId, position: deletedPosition } = parentRows[0];

		// Delete the page and all its descendants using a recursive CTE query
		const deleteQuery = `
			WITH RECURSIVE descendants AS (
				SELECT id FROM pages WHERE id = $1
				UNION ALL
				SELECT a.id FROM pages a INNER JOIN descendants d ON a.parent = d.id
			)
			DELETE FROM pages WHERE id IN (SELECT id FROM descendants)
			RETURNING id;
		`;

		const { rows: deletedRows } = await pool.query(deleteQuery, [id]);
		const deletedIds = deletedRows.map(row => row.id);

		// Update positions of sibling pages
		if (parentId) {

			await pool.query(`
				UPDATE pages
				SET position = position - 1
				WHERE parent = $1 AND position > $2
			`, [parentId, deletedPosition]);

		}

		return deletedRows; // Return all deleted pages

	} catch (error) {

		console.error("Error removing article and its descendants:", error);
		throw error;

	}

};

/**
 * Retrieves a page by its ID along with its subpages
 * @param {number} id - The ID of the page to retrieve
 * @returns {Object|null} The page object with its subpages, or null if not found
 */
async function getPageById(id) {

	try {

		// Query to get the page details
		const pageQuery = `
			SELECT id, title, text, parent
			FROM pages
			WHERE id = $1;
		`;

		// Query to get the subpages ordered by position
		const subpagesQuery = `
			SELECT id, title
			FROM pages
			WHERE parent = $1
			ORDER BY position ASC;
		`;

		const { rows: pageRows } = await pool.query(pageQuery, [id]);

		if (pageRows.length === 0) return null;

		const { rows: subpageRows } = await pool.query(subpagesQuery, [id]);

		return {

			...pageRows[0],
			subpages: subpageRows // Includes ordered subpages

		};

	} catch (error) {

		console.error('Error fetching page:', error);
		throw error;

	}

};

/**
 * Builds a breadcrumb trail from the given page ID up to the root
 * @param {number} id - The ID of the page to start the breadcrumb trail from
 * @returns {Array} Array of objects representing the breadcrumb trail
 */
async function getBreadcrumbsById(id) {

	try {

		let breadcrumbs = [];
		let currentId = id;

		// Traverse up the page hierarchy until reaching the root
		while (currentId) {

			const query = `
				SELECT id, title, parent
				FROM pages
				WHERE id = $1
			`;

			const { rows } = await pool.query(query, [currentId]);
			if (rows.length === 0) break;

			const page = rows[0];
			breadcrumbs.unshift({ id: page.id, title: page.title }); // Add to the beginning
			
			currentId = page.parent; // Move up to the parent
		}

		return breadcrumbs;

	} catch (error) {

		console.error('Error fetching breadcrumbs:', error);
		throw error;

	}

};

/**
 * Retrieves all pages and organizes them into a hierarchical structure
 * @returns {Array} Array of root pages with nested children
 */
async function getAllPages() {
	
	try {
		
		const query = `
			SELECT id, title, text, parent, position
			FROM pages
			ORDER BY position ASC;
		`;

		const { rows: pages } = await pool.query(query);
		const pagesById = {};

		// First pass: create a lookup table by ID
		pages.forEach(article => {
		
			pagesById[article.id] = { ...article, children: [] };
		
		});

		const rootpages = [];

		// Second pass: build the hierarchy
		pages.forEach(article => {
		
			if (article.parent) {
		
				// Add as child to parent
				pagesById[article.parent]?.children.push(pagesById[article.id]);
		
			} else {
			
				// Add to root pages
				rootpages.push(pagesById[article.id]);
			}
		
		});

		return rootpages; // Return hierarchical structure in order

	} catch (error) {

		console.error('Error fetching pages:', error);
		throw error;

	}

};

/**
 * Moves a page up in the order (decreases its position)
 * @param {number} id - The ID of the page to move up
 * @returns {Object} Success status and message
 */
async function movePageUp(id) {

	try {

		// Get the current page's position and parent
		const currentQuery = `SELECT id, position, parent FROM pages WHERE id = $1`;
		const { rows: currentRows } = await pool.query(currentQuery, [id]);

		if (currentRows.length === 0) return { success: false, message: "Page not found" };

		const { position, parent } = currentRows[0];

		// Find the page directly above (lower position number)
		const swapQuery = `
			SELECT id, position FROM pages 
			WHERE parent IS NOT DISTINCT FROM $1 AND position < $2 
			ORDER BY position DESC LIMIT 1;
		`;

		const { rows: swapRows } = await pool.query(swapQuery, [parent, position]);

		if (swapRows.length === 0) return { success: false, message: "Already at top" };

		const { id: swapId, position: swapPosition } = swapRows[0];

		// Swap positions with the page above
		await pool.query(`UPDATE pages SET position = $1 WHERE id = $2`, [swapPosition, id]);
		await pool.query(`UPDATE pages SET position = $1 WHERE id = $2`, [position, swapId]);

		return { success: true };

	} catch (error) {

		console.error("Error moving page up:", error);
		throw error;

	}

};

/**
 * Moves a page down in the order (increases its position)
 * @param {number} id - The ID of the page to move down
 * @returns {Object} Success status and message
 */
async function movePageDown(id) {

	try {

		// Get the current page's position and parent
		const currentQuery = `SELECT id, position, parent FROM pages WHERE id = $1`;
		const { rows: currentRows } = await pool.query(currentQuery, [id]);

		if (currentRows.length === 0) return { success: false, message: "Page not found" };

		const { position, parent } = currentRows[0];

		// Find the page directly below (higher position number)
		const swapQuery = `
			SELECT id, position FROM pages 
			WHERE parent IS NOT DISTINCT FROM $1 AND position > $2 
			ORDER BY position ASC LIMIT 1;
		`;

		const { rows: swapRows } = await pool.query(swapQuery, [parent, position]);

		if (swapRows.length === 0) return { success: false, message: "Already at bottom" };

		const { id: swapId, position: swapPosition } = swapRows[0];

		// Swap positions with the page below
		await pool.query(`UPDATE pages SET position = $1 WHERE id = $2`, [swapPosition, id]);
		await pool.query(`UPDATE pages SET position = $1 WHERE id = $2`, [position, swapId]);

		return { success: true };

	} catch (error) {

		console.error("Error moving page down:", error);
		throw error;

	}

};


module.exports = { createPage, editPageById, removePageById, getPageById, getBreadcrumbsById, getFirstLevelOfPages, getAllPages, movePageUp, movePageDown };