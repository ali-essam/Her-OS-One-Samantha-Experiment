function QAEntry(questions, answers, file) {
	this.q = questions;
	this.a = answers;
	this.f = file;
}

var addBtn = document.querySelector('#addqa-btn');
var updateBtn = document.querySelector('#updateqa-btn');
var qaTxt = document.querySelector('#question-txt');
var ansTxt = document.querySelector('#answer-txt');
var dbTxt = document.querySelector('#db-txt');

var qasdb = localStorage.qasdb ? JSON.parse(localStorage.qasdb) : [];
dbTxt.value = JSON.stringify(qasdb);

addBtn.onclick = function() {
	var qs = qaTxt.value.split('\n\n');
	for (var i = 0; i < qs.length; i++) {
		qas = qs[i].split('\n');
		qa = new QAEntry(qas[0], qas[1], qas[2]);
		qasdb.push(qa);
	};
	localStorage.qasdb = JSON.stringify(qasdb);
	dbTxt.value = localStorage.qasdb;
};

updateBtn.onclick = function() {
	localStorage.qasdb = dbTxt.value;
	qasdb = JSON.parse(localStorage.qasdb);
}