// Updating pages
const removePageButtons = document.querySelectorAll('.remove-page');

for ( const button of removePageButtons ) {

	button.addEventListener( 'click', removePage );

}

async function removePage() {

	const entry = this.parentNode.parentNode;
	const pageId = this.getAttribute('page-id');
	const childButtons = entry.querySelectorAll('button, a')

	for ( const button of childButtons ) {

		button.disabled = true;

	}

	entry.classList.add('loading');

	const response = await fetch(`/sivu/${pageId}/poista`, {
		
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
		}
	
	});

	const content = await response.json();

	if ( !content.success ) {

		redirect("/login");

	} else {

		entry.remove();
		entry.classList.remove('loading');

	}

};

document.querySelectorAll(".move-up").forEach(button => {
	
	button.addEventListener("click", async () => {
	
		await movePage(button.dataset.id, "up");
		updateMoveButtons(); // Disable buttons if needed
	
	});

});

document.querySelectorAll(".move-down").forEach(button => {
	
	button.addEventListener("click", async () => {
	
		document.activeElement.blur();
		await movePage(button.dataset.id, "down");
		updateMoveButtons(); // Disable buttons if needed
	
	});

});

async function movePage(pageId, direction) {
	
	const response = await fetch(`/sivu/reorder`, {
	
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ pageId, direction })
	
	});

	const content = await response.json();

	if (content.success) {
		const pageElement = document.querySelector(`button[data-id="${pageId}"]`).closest("li");
		if (!pageElement) return;

		const sibling = direction === "up"
			? pageElement.previousElementSibling
			: pageElement.nextElementSibling;

		if (!sibling) return;

		const parent = pageElement.parentElement;

		if (direction === "up") {
			parent.insertBefore(pageElement, sibling);
		} else {
			parent.insertBefore(sibling, pageElement);
		}

		updateMoveButtons(); // Update the button states after movement
	
	} else {
	
		redirect('/../login');
	}

};

function updateMoveButtons() {

	document.querySelectorAll("li").forEach(li => {

		const moveUpButton = li.querySelector(".move-up");
		const moveDownButton = li.querySelector(".move-down");

		if (!moveUpButton || !moveDownButton) return;

		// Disable "up" button if it's the first child
		moveUpButton.disabled = !li.previousElementSibling;

		// Disable "down" button if it's the last child
		moveDownButton.disabled = !li.nextElementSibling;

	});

};

// Run this once when the page loads to set the correct initial states
updateMoveButtons();



// Updating contact information
const updateContactInfoButton = document.getElementById('update-contact-info-button');

updateContactInfoButton.addEventListener( 'click', updateContactInfo );

async function updateContactInfo() {

	const numberInput = document.getElementById('number-input');
	const emailInput = document.getElementById('email-input');

	const number = numberInput.value;
	const email = emailInput.value;

	numberInput.disabled = true;
	emailInput.disabled = true;
	updateContactInfoButton.disabled = true;
	updateContactInfoButton.classList.add("loading");

	const response = await fetch("/yhteistiedot", {

		method: "POST",
		headers: {
			"Content-Type": "application/json",
			'Accept': 'application/json',
		},
		body: JSON.stringify({ number, email })

	});

	const content = await response.json();

	if ( !content.success ) {
		
		redirect('/login');

	}

	numberInput.disabled = false;
	emailInput.disabled = false;
	updateContactInfoButton.disabled = false;
	updateContactInfoButton.classList.remove("loading");

};


const dropArea = document.getElementById("drop-file");
const uploadFileButton = document.getElementById("upload-file-button");
const cancelUploadFileButton = document.getElementById("cancel-upload-file-button");

// Prevent default behavior for drag events
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {

	dropArea.addEventListener(eventName, (e) => e.preventDefault());

});

// Highlight on dragover
dropArea.addEventListener("dragover", () => {

	dropArea.classList.add("highlight");

});

// Remove highlight on drag leave
dropArea.addEventListener("dragleave", () => {

	dropArea.classList.remove("highlight");

});

let file;

// Handle file drop
dropArea.addEventListener("drop", (event) => {

	dropArea.classList.remove("highlight");

	const files = event.dataTransfer.files;
	const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];

	if (!allowedTypes.includes(files[0].type)) {

		return;
	
	}

	file = files[0];

	dropArea.querySelector('h4').innerText = `Valitsit tiedoston: "${file.name}"`;
	dropArea.querySelector('h5').innerText = `Paina "Lähetä tiedosta" tai "Peruuta"`;

	uploadFileButton.disabled = false;
	cancelUploadFileButton.disabled = false;

});

uploadFileButton.addEventListener('click', uploadFile);
cancelUploadFileButton.addEventListener('click', cancelUploadFile);

// Handle file upload
async function uploadFile() {

	uploadFileButton.disabled = true;
	uploadFileButton.classList.add('loading');
	cancelUploadFileButton.disabled = true;
	
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/laskuri/lataa-uusi", {
		
		method: "POST",
		body: formData

	});

	const content = await response.json();

	if (content.success) {
		
		uploadFileButton.classList.remove('loading');
	
	}

	file = undefined;
	dropArea.querySelector('h4').innerText = `Raahaa ja tiputa tiedosto`;
	dropArea.querySelector('h5').innerText = `tai etsi tiedosto laitteesta`;
	
};

// Create a hidden file input
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".xlsx";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// Trigger file input when clicking the drop area
dropArea.addEventListener("click", () => {

	fileInput.click();

});

// Handle file selection manually
fileInput.addEventListener("change", (event) => {

	const files = event.target.files;
	const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

	if (!allowedTypes.includes(files[0].type)) {
	
		return;
	
	}

	file = files[0];

	dropArea.querySelector('h4').innerText = `Valitsit tiedoston: "${file.name}"`;
	dropArea.querySelector('h5').innerText = `Paina "Lähetä tiedosto" tai "Peruuta"`;

	uploadFileButton.disabled = false;
	cancelUploadFileButton.disabled = false;

});

function cancelUploadFile() {

	file = undefined;
	uploadFileButton.disabled = true;
	cancelUploadFileButton.disabled = true;
	dropArea.querySelector('h4').innerText = `Raahaa ja tiputa tiedosto`;
	dropArea.querySelector('h5').innerText = `tai etsi tiedosto laitteesta`;

};