function allQuestionsAnswered() {

	const questions = document.querySelectorAll('.question');

	for ( const question of questions ) {

		const options = question.querySelectorAll('input[type=radio]:checked');

		if ( options.length === 0 ) return false; 

	}

	return true;

};

function extractAnswers() {

    const questions = document.querySelectorAll(".question input:checked");
    const answers = Array.from(questions).map(input => input.labels[0].innerText.trim());
    return answers.join(";");

};

const options = document.querySelectorAll('input[type=radio]');

for ( const option of options ) {

	option.addEventListener('change', questionAnswered );

}

async function questionAnswered() {

	if ( !allQuestionsAnswered() ) return;

	const answers = extractAnswers();

	const response = await fetch( "/laskuri", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			'Accept': 'application/json'
		},
	  	body: JSON.stringify({ answers })
	});

	const content = await response.json();

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "<h2>Tulos</h2>";

    for ( const [key, value] of Object.entries(content) ) {

		const resultItem = document.createElement("p");
		resultItem.classList.add("capitalize");
		resultItem.innerHTML = `<span">${key}</span>: <strong>${value}</strong>`;
		resultsContainer.appendChild(resultItem);

    }

};