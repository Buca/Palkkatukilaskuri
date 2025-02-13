const express = require('express');
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
const { getContactInfo } = require('../models/ContactInformation');
const { getFirstLevelOfPages } = require('../models/Page');

const router = express.Router();

router.use(fileUpload());

function extractQuestions() {

	const questions = {};
	const questionsLength = jsonSheet[0]['yhteenveto'].split(';').length;
	const keys = Object.keys(jsonSheet[0]);
	
	for (let i = 1; i < questionsLength + 1; i ++) {
		
		questions[ keys[i] ] = [];
	
	}

	for (let i = 0; i < jsonSheet.length; i ++) {

		const entry = jsonSheet[ i ];

		for (let j = 1; j < questionsLength + 1; j ++) {
			
			const key = keys[ j ];
			const answer = entry[ key ];
			const question = questions[ key ];

			if( question.indexOf( answer ) === -1 ) {

				question.push( answer );

			}
		
		}

	}

	return questions;

};

function getResponse( answers ) {

	const response = {};

	for (let i = 0; i < jsonSheet.length; i ++ ) {

		const entry = jsonSheet[ i ];
		if ( entry['yhteenveto'] === answers ) {

			const keys = Object.keys(jsonSheet[0]);
			const questionsLength = jsonSheet[0]['yhteenveto'].split(';').length;

			for (let j = questionsLength + 1; j <= keys.length; j ++) {

				const key = keys[ j ];
				response[ key ] = entry[ key ];

			}

			break;

		}

	}

	response['prosentti'] = response['prosentti'] * 100 + " %";
	response['tuki maksimissaan kuukaudessa'] = response['tuki maksimissaan kuukaudessa'] + " €";



	if ( response['huom!'] ) {

		response['huom!'] = response['huom!'].trim();

		if ( response['huom!'].charAt( response['huom!'].length - 1 ) !== "." ) {

			response['huom!'] = response['huom!'] + ". ";

		}

	} 

	if ( response['huom! 2'] ) {

		response['huom! 2'] = response['huom! 2'].trim();

		if ( response['huom! 2'].trim().charAt( response['huom! 2'].length - 1 ) !== "." ) {

			response['huom! 2'] = response['huom! 2'].trim() + ".";

		}

	}

	if ( response['huom!'] || response['huom! 2'] ) {

		response['Huomioitavaa'] = "";

		if ( response['huom!'] ) {

			response['Huomioitavaa'] += response['huom!'] + " ";

		}

		if ( response['huom! 2'] ) {

			response['Huomioitavaa'] += response['huom! 2'];

		}

	}


	
	delete response['huom!'];
	delete response['huom! 2'];

	return response;

};

let workbook = xlsx.readFile('./private/data/Palkkatukilaskuri.xlsx');
let jsonSheet = xlsx.utils.sheet_to_json( workbook.Sheets['taustamatriisi'] );
let questions = extractQuestions();

router.post('/', async (req, res, next) => {

	const answers = req.body.answers;

	res.json( getResponse( answers ) );

});

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

router.post("/lataa-uusi", async (req, res, next) => {

	console.log('Upload request!');

    try {

        if (!req.files || !req.files.file) {
            return next();
        }

        const uploadedFile = req.files.file;

        await uploadedFile.mv('./private/data/Palkkatukilaskuri.xlsx');

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

router.get("/lataa-nykyinen", async (req, res, next) => {

	const isAuthenticated = req.session.isAuthenticated;

    try {

    	if ( isAuthenticated ) {

	        // Send the file as a download
	        res.download("./private/data/Palkkatukilaskuri.xlsx", "Palkkatukilaskuri.xlsx", (error) => {
	            
	            if (error) { 

	            	next(error); 

	            }

	        });

    	} else {

    		res.redirect('/../login')

    	}

    } catch (error) {
    
        next(error);
    
    }

});

module.exports = router;