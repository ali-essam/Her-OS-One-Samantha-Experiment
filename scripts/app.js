window.onload = init;
var audioContext;
var analyser;
var frequencyData;

var canvas = document.querySelector('#cnv');
var canvasCtx = canvas.getContext('2d');
var CANVAS_WIDTH = 256;
var CANVAS_HEIGHT = 64;

var qasdb = [];

var inpTxt = document.querySelector('#inp-txt');
var chatHistoryDiv = document.querySelector('#chat-history');
var micIcon = document.querySelector('#mic-icon');

var recognition;
var recognitionOn = false;

var animationId;

function init() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audioContext = new AudioContext();
	// TODO: OS Introduction.
	//playSound('./audio/hello.ogg');
	loadQAsDBJSON();
	initSpeechRecognition();
	recognition.start();
}

// Input handling

function handleInput(question) {
	var qa = findQA(question);
	chatHistoryDiv.innerHTML += "You: " + question + '</br>';
	if (qa != null) {
		chatHistoryDiv.innerHTML += "Samantha: " + qa.a + '</br>';
		playSound('./audio/samantha/' + qa.f + '.ogg');
	} else {
		chatHistoryDiv.innerHTML += "Samantha: " + "I don't know!" + '</br>';
		errNum = Math.floor(Math.random() * 3) + 1;
		playSound('./audio/samantha/e' + errNum + '.ogg');
	}
	chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// Questions/Answers Database

function loadQAsDBJSON() {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', 'scripts/qasdb.json', true);
	xobj.onreadystatechange = function() {
		if (xobj.readyState == 4 && xobj.status == "200") {
			qasdb = JSON.parse(xobj.responseText);
		}
	};
	xobj.send(null);
}

function findQA(question) {
	var bestQA = null,
		bv = 0.3;
	qasdb.map(function(qa) {
		var v = question.fuzzy(qa.q, 0.3);
		if (v > bv) {
			bv = v;
			bestQA = qa;
		}
	});
	return bestQA;
}

// Speech Recognition

function initSpeechRecognition() {
	if (!('webkitSpeechRecognition' in window)) {
		// TODO: Alert user (micIcon, text).
		console.error('Speech Recognition Not Available');
	} else {
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = false;

		recognition.onstart = function() {
			recognitionOn = true;
			addClass(micIcon, 'pulsating');
			console.log('recognition started');
		}
		recognition.onend = function() {
			recognitionOn = false;
			removeClass(micIcon, 'pulsating');
			console.log('recognition ended');
		}

		recognition.onresult = onSpeechResult;
		recognition.onerror = onSpeechError;
	}
}

function onSpeechResult(event) {
	var msg = '';
	for (var i = event.resultIndex; i < event.results.length; i++) {
		msg += event.results[i][0].transcript;
	};
	console.log(msg);
	handleInput(msg);
}

function onSpeechError(event) {
	console.error(event);
	// TODO: Handle network and not-allowed errors.
}

// Sound Play

function playSound(path) {
	var bufferLoader = new BufferLoader(
		audioContext, [
			path
		],
		finishedLoadingSound
	);
	bufferLoader.load();
}

function finishedLoadingSound(bufferList) {
	var source = audioContext.createBufferSource();
	analyser = audioContext.createAnalyser();
	source.buffer = bufferList[0];
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	frequencyData = new Uint8Array(analyser.frequencyBinCount);
	source.start(0);
	playing = true;
	source.onended = function() {
		cancelAnimationFrame(animationId);
	}
	updateAnimation();
}

// Animation

var waveDisp = 0;

function updateAnimation() {
	animationId = requestAnimationFrame(updateAnimation);
	analyser.getByteFrequencyData(frequencyData);
	// TODO: Use volume instead of summing various freqs.
	var sum = 0;
	for (var i = 0; i < frequencyData.length; i++) {
		sum += frequencyData[i];
	}
	var avg = sum / frequencyData.length;
	// Magical Values choosen by fairy creatures.
	waveDisp += 0.07 * avg / 20;
	drawSpectrum(avg / 80, waveDisp);
}

function drawSpectrum(amp, disp) {
	canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	var waveZoom = 47;
	for (var dir = -1; dir <= 1; dir += 2) {
		canvasCtx.beginPath();
		canvasCtx.lineWidth = 7;
		canvasCtx.strokeStyle = "rgb(230,230,230)";
		for (var i = 0; i <= CANVAS_WIDTH; i++) {
			var y = dir * amp * Math.sin(1 / waveZoom * i + disp);
			canvasCtx.lineTo(0.5 + i, CANVAS_HEIGHT / 2 - y * CANVAS_HEIGHT / 2);
		}
		canvasCtx.stroke();
	}
}

// Event Handlers

inpTxt.onkeydown = function(e) {
	if (e.keyCode == 13) {
		handleInput(inpTxt.value);
		inpTxt.value = "";
	}
}

micIcon.onclick = function() {
	if (!recognitionOn)
		recognition.start();
	else
		recognition.stop();
}

inpTxt.onblur = function() {
	inpTxt.focus();
}

// Helper Functions

function hasClass(ele, cls) {
	return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function addClass(ele, cls) {
	if (!hasClass(ele, cls)) ele.className += " " + cls;
}

function removeClass(ele, cls) {
	if (hasClass(ele, cls)) {
		var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
		ele.className = ele.className.replace(reg, ' ');
	}
}