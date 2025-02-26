const titleInput = document.querySelector('#edit-page .title');
const lastBreadcrumb = document.querySelector('#breadcrumbs a:last-child');
titleInput.addEventListener('input', onInput);
onInput();

function onInput() {

	// Change the text in the last element in the breadcrumbs
	lastBreadcrumb.innerText = titleInput.value;

	// Resize the input width:
	titleInput.style.width = Math.ceil( titleInput.value.length*1.5 ) + "ch";

};

const quill = new Quill('#editor', {
	
	modules: {
		toolbar: [
			['bold', 'italic', 'underline', 'strike'],
			['link'],
			[{ 'size': ['small', false, 'large', 'huge'] }],
			[{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
			[{ 'list': 'ordered'}, { 'list': 'bullet' }],
		],
	},
	placeholder: '',
	theme: 'snow', // or 'bubble'

});
