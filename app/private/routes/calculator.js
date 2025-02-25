const express = require('express');
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
const { getContactInfo } = require('../models/ContactInformation');
const { getFirstLevelOfPages } = require('../models/Page');

const router = express.Router();

router.use(fileUpload());

// Function to extract unique questions from the data
function extractQuestions() {

	const questions = {};
	const questionsLength = jsonSheet[0]['yhteenveto'].split(';').length;
	const keys = Object.keys(jsonSheet[0]);

	// Initialize question keys with empty arrays
	for (let i = 1; i < questionsLength + 1; i++) {

		questions[keys[i]] = [];

	}

	// Populate question choices with unique values from the dataset
	for (let i = 0; i < jsonSheet.length; i++) {

		const entry = jsonSheet[i];

		for (let j = 1; j < questionsLength + 1; j++) {

			const key = keys[j];
			const answer = entry[key];
			const question = questions[key];

			// Add answer only if it's not already included
			if (question.indexOf(answer) === -1) {

				question.push(answer);

			}

		}

	}

	return questions;

};

// Function to get response based on selected answers
function getResponse(answers) {

	const response = {};

	// Iterate through the dataset to find a matching response
	for (let i = 0; i < jsonSheet.length; i++) {

		const entry = jsonSheet[i];

		if (entry['yhteenveto'] === answers) {

			const keys = Object.keys(jsonSheet[0]);
			const questionsLength = jsonSheet[0]['yhteenveto'].split(';').length;

			// Extract response fields after the question-related ones
			for (let j = questionsLength + 1; j <= keys.length; j++) {

				const key = keys[j];
				response[key] = entry[key];

			}

			break;

		}

	}

	// Format numerical values for percentage and monetary amount
	response['prosentti'] = response['prosentti'] * 100 + " %";
	response['tuki maksimissaan kuukaudessa'] = response['tuki maksimissaan kuukaudessa'] + " €";

	// Clean and ensure proper punctuation for additional notes
	if (response['huom!']) {

		response['huom!'] = response['huom!'].trim();

		if (response['huom!'].charAt(response['huom!'].length - 1) !== ".") {

			response['huom!'] = response['huom!'] + ". ";

		}

	}

	if (response['huom! 2']) {

		response['huom! 2'] = response['huom! 2'].trim();

		if (response['huom! 2'].charAt(response['huom! 2'].length - 1) !== ".") {

			response['huom! 2'] = response['huom! 2'] + ".";

		}

	}

	// Combine additional notes into a single key for convenience
	if (response['huom!'] || response['huom! 2']) {

		response['Huomioitavaa'] = "";

		if (response['huom!']) {

			response['Huomioitavaa'] += response['huom!'] + " ";

		}

		if (response['huom! 2']) {

			response['Huomioitavaa'] += response['huom! 2'];

		}

	}

	// Remove redundant individual note keys
	delete response['huom!'];
	delete response['huom! 2'];

	return response;

};

// Load Excel data into JSON format
let workbook = xlsx.readFile('./private/data/Palkkatukilaskuri.xlsx');
let jsonSheet = xlsx.utils.sheet_to_json(workbook.Sheets['taustamatriisi']);
let questions = extractQuestions();

// Route to process user responses and return the calculated result
router.post('/', async (req, res, next) => {
	
	const answers = req.body.answers;
	res.json(getResponse(answers));

});

// Route to render the calculator page with available questions
router.get('/', async (req, res, next) => {

	try {

		const isAuthenticated = req.session.isAuthenticated;
		const contactInfo = await getContactInfo(); // Fetch any relevant contact info if needed
		const firstLevelOfPages = await getFirstLevelOfPages();

		res.render('calculator', {

			isAuthenticated,
			contactInfo,
			firstLevelOfPages,
			questions

		});

	} catch (error) {

		next(error);

	}

});

// Route to upload a new Excel file and reload data
router.post("/lataa-uusi", async (req, res, next) => {

	try {

		// Ensure a file is provided in the request
		if (!req.files || !req.files.file) {

			return next();

		}

		const uploadedFile = req.files.file;

		// Move the uploaded file to the designated location
		await uploadedFile.mv('./private/data/Palkkatukilaskuri.xlsx');

		// Reload the workbook and update the dataset
		workbook = xlsx.readFile('./private/data/Palkkatukilaskuri.xlsx');
		jsonSheet = xlsx.utils.sheet_to_json(workbook.Sheets['taustamatriisi']);
		questions = extractQuestions();

		res.json({

			success: true,
			message: "File processed successfully."

		});

	} catch (error) {

		next(error);

	}

});

// Route to download the current Excel file
router.get("/lataa-nykyinen", async (req, res, next) => {

	const isAuthenticated = req.session.isAuthenticated;

	try {

		if (isAuthenticated) {

			// Send the file as a downloadable attachment
			res.download("./private/data/Palkkatukilaskuri.xlsx", "Palkkatukilaskuri.xlsx", (error) => {

				if (error) {

					next(error);

				}

			});

		} else {

			// Redirect unauthenticated users to the login page
			res.redirect('/../login');

		}

	} catch (error) {

		next(error);

	}

});

module.exports = router;