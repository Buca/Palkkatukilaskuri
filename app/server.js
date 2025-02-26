const dotenv = require("dotenv").config();
const SERVER_PORT = process.env.SERVER_PORT;
const SESSION_KEY = process.env.SESSION_KEY;

const express = require('express');
const session = require('express-session');

const database = require('./private/config/db');

const homeRoute = require('./private/routes/home');
const controlpanelRoute = require('./private/routes/controlpanel');
const pageRoute = require('./private/routes/page');
const userRoute = require('./private/routes/user');
const calculatorRoute = require('./private/routes/calculator');
const contactInfoRoute = require('./private/routes/contact-information');

const { getContactInfo } = require("./private/models/ContactInformation");
const { getFirstLevelOfPages } = require("./private/models/Page");

const app = express();

// Session middleware configuration
app.use(
	session({
		secret: SESSION_KEY,
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: 12 * 60 * 60 * 1000, // 12 hours
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			sameSite: 'strict'
		}
	})
);

// View engine and static files setup
app.set('view engine', 'ejs');
app.set("views", __dirname + "/private/views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// Route handling
app.use('/', homeRoute);
app.use('/', userRoute);
app.use('/yhteistiedot', contactInfoRoute);
app.use('/hallinta', controlpanelRoute);
app.use('/sivu', pageRoute);
app.use('/laskuri', calculatorRoute);

// 404 Error handler
app.use(async (req, res, next) => {

	const isAuthenticated = req.session.isAuthenticated;
	const contactInfo = await getContactInfo();
	const firstLevelOfPages = await getFirstLevelOfPages();

	res.status(404).render("error", {
	
		status: 404,
		message: "Sivua ei löytynyt",
		isAuthenticated,
		contactInfo,
		firstLevelOfPages
	
	});

});

// Global error handler
app.use(async (err, req, res, next) => {

	console.error(err.stack);

	const isAuthenticated = req.session.isAuthenticated;
	const contactInfo = await getContactInfo();
	const firstLevelOfPages = await getFirstLevelOfPages();

	res.status(err.status || 500).render("error", {
	
		status: err.status || 500,
		message: err.message || "Sisäinen palvelinvirhe",
		isAuthenticated,
		contactInfo,
		firstLevelOfPages
	
	});

});

// Start the server and initialize the database
app.listen(SERVER_PORT, async () => {

	console.log('Initializing database...');
	await database.query(`
		CREATE TABLE IF NOT EXISTS pages(
			id			SERIAL		PRIMARY KEY,
			title		TEXT		NOT NULL,
			text		TEXT		NOT NULL,
			position	INTEGER		NOT NULL,
			parent		INTEGER		REFERENCES articles(id),
			children	INTEGER[]	DEFAULT '{}'
		);
	`);
	console.log('Database initialized successfully.');
	console.log('Web server is running on port ' + SERVER_PORT);

});
