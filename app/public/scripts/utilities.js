async function delay( ms ) {
	
	return new Promise( resolve => setTimeout(resolve, ms) );

};

function redirect( location ) {

	window.location.href = location;

};