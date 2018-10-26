'use strict';

let iteratePlayButtons=function (doEach){
	document.querySelector('iframe#mainFrame').contentDocument.querySelectorAll('.play_but').forEach(function (e){
		let playButton=e.querySelector('input[type="button"]');
		let playPayload=playButton.attributes.onclick.value;
		let playFileUrl=/PlaySound\('(.+?)'\)/.exec(playPayload);
		if(playFileUrl){
			doEach(playFileUrl[1],e);
		}
	});
},isListeningPage=function (){
	let innerHtml=document.querySelector('iframe#mainFrame').contentDocument.documentElement.innerHTML;
	return innerHtml.indexOf('PlaySound')>-1;
},getPlayBaseUrl=function (){
	let playBaseUrl;
	document.querySelector('iframe#mainFrame').contentDocument.querySelectorAll('script').forEach(function (e){
		if(e.innerHTML.indexOf('PlaySound')>-1){
			playBaseUrl=e.innerHTML.match(/soundfile = "(.+?)"/)[1];
			return;
		}
	});
	return playBaseUrl;
}

chrome.runtime.onMessage.addListener(function (message,sender,respond){
	let {data,operation}=message;
	switch(operation){
		case 'isListeningPage':
			respond(isListeningPage());
			break;
		case 'showDownloadButton':
			if(!isListeningPage()){
				break;
			}
			iteratePlayButtons(function (playFileUrl,e){
				let fileUrl=getPlayBaseUrl()+playFileUrl;
				let downloadButton=document.querySelector('iframe#mainFrame').contentDocument.createElement('a');
				downloadButton.setAttribute('href',fileUrl);
				downloadButton.setAttribute('download','listening');
				downloadButton.textContent='下载录音';
				e.appendChild(downloadButton);
			});
			break;
		case 'getSoundFilenames':
			if(!isListeningPage()){
				break;
			}
			let soundFileNames=[];
			iteratePlayButtons(function (playFileUrl){
				soundFileNames.push(playFileUrl);
			});
			respond(soundFileNames);
			break;
		case 'getPlayBaseUrl':
			if(!isListeningPage()){
				break;
			}
			respond(getPlayBaseUrl());
			break;
		default:
			console.error('Unknown operation!');
			console.log(message,sender);
			break;
	}
});
