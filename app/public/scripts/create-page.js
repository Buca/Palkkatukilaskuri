const publishButton = document.getElementById('publish-button');
const cancelButton = document.getElementById("cancel-button");

publishButton.addEventListener( 'click', publish );
cancelButton.addEventListener( 'click', cancel );

async function publish() {

	const titleInput = document.getElementById("page-title");
	const htmlInput = document.querySelector(".ql-editor");

	const title = titleInput.value;
	const html = htmlInput.innerHTML;

	titleInput.disabled = true;
	publishButton.disabled = true;
	cancelButton.disabled = true;
	publishButton.classList.add("loading");

	const response = await fetch( window.location.pathname, {

		method: "POST",
		headers: {
			"Content-Type": "application/json",
			'Accept': 'application/json',
		},
	  	body: JSON.stringify({ title, html })

	});

	const content = await response.json();

	if ( content.success ) {

		publishButton.classList.remove("loading");
		redirect('/hallinta');

	}

};

function cancel() {

	redirect('/hallinta');

};