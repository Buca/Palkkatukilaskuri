const saveChangesButton = document.getElementById('save-changes-button');
const cancelChangesButton = document.getElementById("cancel-changes-button");
const removePageButton = document.getElementById("remove-page-button");

saveChangesButton.addEventListener( 'click', saveChanges );
cancelChangesButton.addEventListener( 'click', cancelChanges );
removePageButton.addEventListener( 'click', removePage );

async function saveChanges() {

	const titleInput = document.getElementById("page-title");
	const htmlInput = document.querySelector(".ql-editor");

	const title = titleInput.value;
	const html = htmlInput.innerHTML;

	titleInput.disabled = true;
	saveChangesButton.disabled = true;
	removePageButton.disabled = true;
	saveChangesButton.classList.add("loading");

	const response = await fetch( window.location.pathname, {

		method: "POST",
		headers: {
			"Content-Type": "application/json",
			'Accept': 'application/json',
		},
	  	body: JSON.stringify({ title, html })

	});

	const content = await response.json();

	saveChangesButton.classList.remove("loading");

	if ( content.success ) {

		redirect('/hallinta');

	} else {

		redirect('/login')

	}

};

function cancelChanges() {

	redirect('/hallinta');

};

async function removePage() {

	const titleInput = document.getElementById("page-title");

	let sequence = window.location.pathname.split('/');
	sequence.pop();
	sequence.push('poista');
	
	const path = sequence.join('/');

	titleInput.disabled = true;
	saveChangesButton.disabled = true;
	removePageButton.disabled = true;

	removePageButton.classList.add("loading");

	const response = await fetch( path, {

		method: "POST",
		headers: {
			"Content-Type": "application/json",
			'Accept': 'application/json',
		}

	});

	const content = await response.json();

	removePageButton.classList.remove("loading");

	if ( content.success ) {

		redirect('/hallinta');

	} else {

		redirect('/login');

	}

};