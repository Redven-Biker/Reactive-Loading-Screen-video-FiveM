var rafID = null;
var analyser = null;
var c = null;
var cDraw = null;
var ctx = null;
var microphone = null;
var ctxDraw = null;

var loader;
var filename;
var fileChosen = false;
var hasSetupUserMedia = false;
var play = true;

var AudioContext = AudioContext || webkitAudioContext;
var context = new AudioContext();

if (!window.requestAnimationFrame)
	window.requestAnimationFrame = window.webkitRequestAnimationFrame;

$(function () {
		"use strict";
	    loader = new BufferLoader();
	    initBinCanvas();	
});

function playSample() {
	fileChosen = true;
	sourceNode = null;
    setupAudioNodes();
	
	var request = new XMLHttpRequest();
	
	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);
	
	request.open('GET', 'music/loading.ogg', true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		
		$("#title").html("XLife");
		onWindowResize();
		$("#title, #artist, #album").css("visibility", "visible");
		
		context.decodeAudioData(request.response, function(buffer) {
		sourceNode.buffer = buffer;
		sourceNode.start(0);
		
		window.addEventListener("keydown", function(){
			console.log(play);
			switch (event.keyCode) {
			  case 32: //SpaceBar                    
				if (play) {
					setTimeout(()=> {
						sourceNode.stop(0)
						 play = false;

					},100)
				} else {
					setTimeout(()=> {
						playSample()
						 play = true;
					},100)
				}
				break;
			}
			return false;

		}, false);
		$("#freq, body").addClass("animateHue");
		}, function(e) {
			console.log(e);
		});
	};
	request.send();
	
	$("button, input").prop("disabled",true);
}

function useMic() 	
{
	"use strict";
	if (!navigator.mediaDevices.getUserMedia) {
		alert("Your browser does not support microphone input!");
		console.log('Your browser does not support microphone input!');
		return;
 	}
	
	navigator.mediaDevices.getUserMedia({audio: true, video: false})
	.then(function(stream) {
		hasSetupUserMedia = true;
		microphone = context.createMediaStreamSource(stream);
		if (analyser === null) analyser = context.createAnalyser();
		microphone.connect(analyser);
		rafID = window.requestAnimationFrame( updateVisualization );
		
		$("#title").html("Mic");
		$("#album").html("Input");
		$("#artist").html("Using");
		onWindowResize();
		$("#title, #artist, #album").css("visibility", "visible");
		$("#freq, body").addClass("animateHue");
	})
	.catch(function(err) {
		alert("Capturing microphone data failed! (currently only supported in Chrome & Firefox)");
		console.log('capturing microphone data failed!');
		console.log(err);
	});
}

function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
	$("button, input").prop("disabled",true);
    var percentComplete = oEvent.loaded / oEvent.total;
	console.log("Loading music file... " + Math.floor(percentComplete * 100) + "%");
	$("#loading").html("Loading... " + Math.floor(percentComplete * 100) + "%");
  } else {
	  console.log("Unable to compute progress info.");
  }
}

function transferComplete(evt) {
  	console.log("The transfer is complete.");
	$("#loading").html("");
}

function transferFailed(evt) {
  	console.log("An error occurred while transferring the file.");
	$("#loading").html("Loading failed.");
	$("button, input").prop("disabled", false);
}

function transferCanceled(evt) {
  	console.log("The transfer has been canceled by the user.");
	$("#loading").html("Loading canceled.");
}

function initBinCanvas () {

	"use strict";
	c = document.getElementById("freq");
	c.width = window.innerWidth;
        c.height = window.innerHeight;
	ctx = c.getContext("2d");
	
	ctx.canvas.width  = window.innerWidth;
  	ctx.canvas.height = window.innerHeight;
	
	window.addEventListener( 'resize', onWindowResize, false );
	
	var gradient = ctx.createLinearGradient(0, c.height - 300,0,window.innerHeight - 25);
	gradient.addColorStop(1,'#00f');
	gradient.addColorStop(0.75,'#f00');
	gradient.addColorStop(0.25,'#f00');
	gradient.addColorStop(0,'#ffff00');

	
	ctx.fillStyle = "#9c0001";
}

function onWindowResize()
{
	ctx.canvas.width  = window.innerWidth;
  	ctx.canvas.height = window.innerHeight;
	
	var containerHeight = $("#song_info_wrapper").height();
	var topVal = $(window).height() / 2 - containerHeight / 2; 
	$("#song_info_wrapper").css("top", topVal);
	console.log(topVal);
	
	if($(window).width() <= 500) {
		$("#title").css("font-size", "40px");
	}
}

var audioBuffer;
var sourceNode;
function setupAudioNodes() {
	analyser = context.createAnalyser();
	sourceNode = context.createBufferSource();	
	sourceNode.connect(analyser);
	sourceNode.connect(context.destination);
	rafID = window.requestAnimationFrame(updateVisualization);
}


function reset () {
	if (typeof sourceNode !== "undefined") {
		sourceNode.stop(0);		
	}
	if (typeof microphone !== "undefined") {
		microphone = null;
	}
}


function updateVisualization () {
        
	if (fileChosen || hasSetupUserMedia) {
		var array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);

		drawBars(array);
	}

	rafID = window.requestAnimationFrame(updateVisualization);
}

function drawBars (array) {

	var threshold = 0;
	ctx.clearRect(0, 0, c.width, c.height);
	var maxBinCount = array.length;
	var space = 3;
        
	ctx.save();


	ctx.globalCompositeOperation='source-over';

	ctx.scale(0.5, 0.5);
	ctx.translate(window.innerWidth, window.innerHeight);
	ctx.fillStyle = "#fff";

	var bass = Math.floor(array[1]);
	var radius = 0.45 * $(window).width() <= 450 ? -(bass * 0.25 + 0.45 * $(window).width()) : -(bass * 0.25 + 450);

	var bar_length_factor = 1;
	if ($(window).width() >= 785) {
		bar_length_factor = 1.0;
	}
	else if ($(window).width() < 785) {
		bar_length_factor = 1.5;
	}
	else if ($(window).width() < 500) {
		bar_length_factor = 20.0;
	}
	console.log($(window).width());
	for ( var i = 0; i < maxBinCount; i++ ){
		
		var value = array[i];
		if (value >= threshold) {			
                        ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
                        ctx.rotate((180 / 128) * Math.PI/180);   
		}
	}  
        
	for ( var i = 0; i < maxBinCount; i++ ){

		var value = array[i];
		if (value >= threshold) {				
						ctx.rotate(-(180 / 128) * Math.PI/180);
						ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
		}
	} 
        
	for ( var i = 0; i < maxBinCount; i++ ){

		var value = array[i];
		if (value >= threshold) {				
						ctx.rotate((180 / 128) * Math.PI/180);
						ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
		}
	} 
    
	ctx.restore();
}

setTimeout(()=>{
	playSample()
},1000)