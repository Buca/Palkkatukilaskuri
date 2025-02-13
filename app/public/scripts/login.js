const loginButton = document.getElementById('login-button');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');

loginButton.addEventListener( "click", login );

usernameInput.addEventListener( "keypress", (event) => {

	if ( event.key === "Enter" ) {

		event.preventDefault();
    	passwordInput.focus();
	
	}

});

passwordInput.addEventListener("keypress", (event) => {

	if ( event.key === "Enter" ) {

		event.preventDefault();
    	loginButton.focus();
    	loginButton.click();

	}

});


async function login() {

	const username = usernameInput.value;
	const password = passwordInput.value;

	if ( username === "" || password === "" ) {

		if( username === "" ) {

			usernameInput.classList.add("required");

		}

		if( password === "" ) {

			passwordInput.classList.add("required");

		}

		return;

	}

	usernameInput.classList.remove("required");
	passwordInput.classList.remove("required");

	usernameInput.disabled = true;
	passwordInput.disabled = true;
	loginButton.disabled = true;
	loginButton.classList.add("loading");

	const response = await fetch("/login", {

		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
		},
	  	body: JSON.stringify({ username, password })
	
	});

	const content = await response.json();
	const notification = document.getElementById("login-notification");

	loginButton.classList.remove("loading");

	if ( content.success ) {

		redirect("/hallinta");

	} else {

		notification.innerText = content.message;
		notification.classList.add('failure');
		notification.classList.remove('hidden');
		
		usernameInput.disabled = false;
		passwordInput.disabled = false;
		loginButton.disabled = false;

	}

};