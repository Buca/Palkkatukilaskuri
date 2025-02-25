const pool = require('../config/db');

async function getFirstLevelOfPages() {

	try {

		const query = `
			SELECT id, title
			FROM articles
			WHERE parent IS NULL
			ORDER BY position ASC;
		`;

		const { rows } = await pool.query(query);
		return rows;

	} catch (error) {

		console.error("Error fetching root articles:", error);
		throw error;

	}

};


async function createPage(title, text, parent = null) {

	try {

		// Fixing the position query for both root and child pages
		const positionQuery = `
			SELECT COALESCE(MAX(position), 0) + 1 AS next_position 
			FROM articles 
			WHERE (parent = $1 OR (parent IS NULL AND $1 IS NULL));
		`;

		const { rows: positionRows } = await pool.query(positionQuery, [parent]);
		const nextPosition = positionRows[0].next_position;

		const insertQuery = `
			INSERT INTO articles (title, text, parent, position)
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

}


async function editPageById(id, title, text) {

	try {

		const query = `
			UPDATE articles
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

async function removePageById(id) {

	try {

		const parentQuery = `SELECT parent, position FROM articles WHERE id = $1`;
		const { rows: parentRows } = await pool.query(parentQuery, [id]);

		if (parentRows.length === 0) {

			throw new Error("Page not found");

		}

		const { parent: parentId, position: deletedPosition } = parentRows[0];

		const deleteQuery = `
			WITH RECURSIVE descendants AS (
				SELECT id FROM articles WHERE id = $1
				UNION ALL
				SELECT a.id FROM articles a INNER JOIN descendants d ON a.parent = d.id
			)
			DELETE FROM articles WHERE id IN (SELECT id FROM descendants)
			RETURNING id;
		`;

		const { rows: deletedRows } = await pool.query(deleteQuery, [id]);
		const deletedIds = deletedRows.map(row => row.id);

		if (parentId) {

			await pool.query(`
				UPDATE articles
				SET position = position - 1
				WHERE parent = $1 AND position > $2
			`, [parentId, deletedPosition]);

		}

		return deletedRows; // Return all deleted articles

	} catch (error) {

		console.error("Error removing article and its descendants:", error);
		throw error;

	}

};

async function getPageById(id) {

	try {

		const pageQuery = `
			SELECT id, title, text, parent
			FROM articles
			WHERE id = $1;
		`;

		const subpagesQuery = `
			SELECT id, title
			FROM articles
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

async function getBreadcrumbsById(id) {
	
	try {

		let breadcrumbs = [];
		let currentId = id;

		while (currentId) {

			const query = `
				SELECT id, title, parent
				FROM articles
				WHERE id = $1
			`;

			const { rows } = await pool.query(query, [currentId]);
			if (rows.length === 0) break;

			const page = rows[0];
			breadcrumbs.unshift({ id: page.id, title: page.title }); // Add to the beginning
			
			currentId = page.parent; // Correct column name

		}

		return breadcrumbs;

	} catch (error) {

		console.error('Error fetching breadcrumbs:', error);
		throw error;

	}

};

async function getAllPages() {
	
	try {

		const query = `
			SELECT id, title, text, parent, position
			FROM articles
			ORDER BY position ASC;
		`;

		const { rows: articles } = await pool.query(query);
		const articlesById = {};

		articles.forEach(article => {

			articlesById[article.id] = { ...article, children: [] };

		});

		const rootArticles = [];

		articles.forEach(article => {

			if (article.parent) {

				articlesById[article.parent]?.children.push(articlesById[article.id]);

			} else {

				rootArticles.push(articlesById[article.id]);

			}

		});

		return rootArticles; // Maintain order

	} catch (error) {

		console.error('Error fetching articles:', error);
		throw error;

	}

};


async function movePageUp(id) {

    try {

        // Get the current page's position and parent
        const currentQuery = `SELECT id, position, parent FROM articles WHERE id = $1`;
        const { rows: currentRows } = await pool.query(currentQuery, [id]);

        if (currentRows.length === 0) return { success: false, message: "Page not found" };

        const { position, parent } = currentRows[0];

        // Find the page directly above (lower position number)
        const swapQuery = `
            SELECT id, position FROM articles 
            WHERE parent IS NOT DISTINCT FROM $1 AND position < $2 
            ORDER BY position DESC LIMIT 1;
        `;

        const { rows: swapRows } = await pool.query(swapQuery, [parent, position]);

        if (swapRows.length === 0) return { success: false, message: "Already at top" };

        const { id: swapId, position: swapPosition } = swapRows[0];

        // Swap positions
        await pool.query(`UPDATE articles SET position = $1 WHERE id = $2`, [swapPosition, id]);
        await pool.query(`UPDATE articles SET position = $1 WHERE id = $2`, [position, swapId]);

        return { success: true };

    } catch (error) {

        console.error("Error moving page up:", error);
        throw error;

    }

};

async function movePageDown(id) {

    try {

        // Get the current page's position and parent
        const currentQuery = `SELECT id, position, parent FROM articles WHERE id = $1`;
        const { rows: currentRows } = await pool.query(currentQuery, [id]);

        if (currentRows.length === 0) return { success: false, message: "Page not found" };

        const { position, parent } = currentRows[0];

        // Find the page directly below (higher position number)
        const swapQuery = `
            SELECT id, position FROM articles 
            WHERE parent IS NOT DISTINCT FROM $1 AND position > $2 
            ORDER BY position ASC LIMIT 1;
        `;

        const { rows: swapRows } = await pool.query(swapQuery, [parent, position]);

        if (swapRows.length === 0) return { success: false, message: "Already at bottom" };

        const { id: swapId, position: swapPosition } = swapRows[0];

        // Swap positions
        await pool.query(`UPDATE articles SET position = $1 WHERE id = $2`, [swapPosition, id]);
        await pool.query(`UPDATE articles SET position = $1 WHERE id = $2`, [position, swapId]);

        return { success: true };

    } catch (error) {

        console.error("Error moving page down:", error);
        throw error;

    }

};


module.exports = { createPage, editPageById, removePageById, getPageById, getBreadcrumbsById, getFirstLevelOfPages, getAllPages, movePageUp, movePageDown };