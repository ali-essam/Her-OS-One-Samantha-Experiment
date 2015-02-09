window.onload = init;
var context;
var analyser;
var frequencyData;

var canvas = document.querySelector('#cnv');
var canvasCtx = canvas.getContext('2d');
var WIDTH = 256;
var HEIGHT = 64;

var qasdb = [];

var inpTxt = document.querySelector('#inp-txt');
var chatHistoryDiv = document.querySelector('#chat-history');
var micIcon = document.querySelector('#mic-icon');

var recognition;
var recognitionStatus = false;

var animationId;

inpTxt.onkeydown = function(e) {
	if(e.keyCode == 13) {
		handleInput(inpTxt.value);
		inpTxt.value = "";
	}
}

micIcon.onclick = function() {
	console.log('micIcon click');
	if(!recognitionStatus)
		recognition.start();
	else
		recognition.stop();
}

inpTxt.onblur = function(){
	inpTxt.focus();
}

function handleInput(question) {
	var qa = findQA(question);
	chatHistoryDiv.innerHTML += "You: " + question + '</br>';
	if(qa != null) {
		chatHistoryDiv.innerHTML += "Samantha: " + qa.a + '</br>';
		playSound('./audio/samantha/'+qa.f+'.ogg');
	}
	else {
		chatHistoryDiv.innerHTML += "Samantha: " + "I don't know!" + '</br>';
		errNum = Math.floor(Math.random() * 3) + 1;
		playSound('./audio/samantha/e' + errNum + '.ogg');
	}
	chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
	
}

function init() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	//playSound('./audio/hello.ogg');
	loadQAsDBJSON();
	initSpeechRecognition();
	recognition.start();
}

function playSound(path) {
	var bufferLoader = new BufferLoader(
		context, [
			path
		],
		finishedLoading
	);
	bufferLoader.load();
}


function initSpeechRecognition() {
	if (!('webkitSpeechRecognition' in window)) {
		console.log('speech recognition error');
	} else {
		recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = false;

		recognition.onstart = function() {
			recognitionStatus = true;
			addClass(micIcon, 'pulsating');
			console.log('recognition started');
		}
		recognition.onresult = onSpeechResult;
		recognition.onerror = function(event) {}
		recognition.onend = function() {
			recognitionStatus = false;
			removeClass(micIcon, 'pulsating');
			console.log('recognition ended');
		}
	}
}

function onSpeechResult(event) {
	var msg = '';
	for (var i = event.resultIndex; i < event.results.length; i++) {
		msg+=event.results[i][0].transcript;
	};
	console.log(msg);
	handleInput(msg);
}

function finishedLoading(bufferList) {
	var source = context.createBufferSource();
	analyser = context.createAnalyser();
	source.buffer = bufferList[0];
	source.connect(analyser);
	analyser.connect(context.destination);
	frequencyData = new Uint8Array(analyser.frequencyBinCount);
	source.start(0);
	playing = true;
	source.onended = function() {cancelAnimationFrame(animationId);}
	update();
}
var H = 0;

function update() {
	animationId = requestAnimationFrame(update);
	analyser.getByteFrequencyData(frequencyData);

	var sum = 0;

	for (var i = 0; i < frequencyData.length; i++) {
		sum += frequencyData[i];
	}
	var avg = sum / frequencyData.length;
	H += 0.07 * avg / 20;
	drawSpectrum(avg / 80, H);
}

function drawSpectrum(w, h) {
	canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	var amp = w;
	var disp = h;
	var wid = 1 / 47;

	for (var dir = -1; dir <= 1; dir += 2) {
		canvasCtx.beginPath();
		canvasCtx.lineWidth = 7;
		canvasCtx.strokeStyle = "rgb(230,230,230)";
		for (var i = 0; i <= WIDTH; i++) {
			var y = dir * amp * Math.sin(wid * i + disp);
			canvasCtx.lineTo(0.5 + i, HEIGHT / 2 - y * HEIGHT / 2); // 
		}
		canvasCtx.stroke();
	}
}

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
	var bestQA = null, bv = 0.3;
	qasdb.map(function(qa){
		var v = question.fuzzy(qa.q, 0.3);
		if(v>bv){
			bv = v;
			bestQA = qa;
		}
	});
	return bestQA;
}

function hasClass(ele,cls) {
  return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls) {
  if (!hasClass(ele,cls)) ele.className += " "+cls;
}

function removeClass(ele,cls) {
  if (hasClass(ele,cls)) {
    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
    ele.className=ele.className.replace(reg,' ');
  }
}