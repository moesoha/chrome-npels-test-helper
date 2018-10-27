'use strict';

let getDocumentVariables=function (varName,callback){
	let magicScript=document.querySelector('iframe#mainFrame').contentDocument.createElement('script');
	let eventName=`MagicThings_${new Date().getTime()}_${Math.floor(Math.random()*10000)}_Event`;
	magicScript.textContent=`
		document.dispatchEvent(new CustomEvent("${eventName}",{
			detail: {
				magic: (typeof(${varName})!=='undefined')?((typeof(${varName})==='function')?${varName}.toString():${varName}):null
			}
		}));
	`;
	document.querySelector('iframe#mainFrame').contentDocument.addEventListener(eventName,function (e){
		callback(e.detail.magic);
	});
	document.querySelector('iframe#mainFrame').contentDocument.body.appendChild(magicScript);
	magicScript.parentNode.removeChild(magicScript);
};

let iteratePlayButtons=function (doEach){
	document.querySelector('iframe#mainFrame').contentDocument.querySelectorAll('.play_but').forEach(function (e){
		let playButton=e.querySelector('input[type="button"]');
		let playPayload=playButton.attributes.onclick.value;
		let playFileUrl=/PlaySound\('(.+?)'/.exec(playPayload);
		if(playFileUrl){
			doEach(playFileUrl[1],e,playButton);
		}
	});
},isListeningPage=function (){
	let innerHtml=document.querySelector('iframe#mainFrame').contentDocument.documentElement.innerHTML;
	return innerHtml.indexOf('PlaySound')>-1;
},getPlayBaseUrl=function (callback){
	getDocumentVariables("PlaySound",function (func){
		if(!func){
			callback(null);
			return;
		}
		let play=func.match(/soundfile = (.+?)src/);
		if(!play){
			callback(null);
			return;
		}
		let sndfile=play[1];
		if(sndfile.match(/resPath/)){
			getDocumentVariables("resPath",function (resPath){
				if(!resPath){
					callback(null);
					return;
				}
				let relativePath=sndfile.match(/resPath\+"(.+?)"/);
				if(!relativePath){
					callback(null);
					return;
				}
				callback(`${resPath}${relativePath[1]}`);
			});
		}else{
			let fullPath=sndfile.match(/"(.+?)"/);
			if(!fullPath){
				callback(null);
				return;
			}
			callback(fullPath[1]);
		}
	});
};

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
			getPlayBaseUrl(function (playBaseUrl){
				iteratePlayButtons(function (playFileUrl,e){
					let fileUrl=playBaseUrl+playFileUrl;
					let downloadButton=document.querySelector('iframe#mainFrame').contentDocument.createElement('a');
					downloadButton.setAttribute('href',fileUrl);
					downloadButton.setAttribute('download','listening');
					downloadButton.textContent='下载录音';
					e.appendChild(downloadButton);
				});
			});
			break;
		case 'showHTMLPlayButton':
			if(!isListeningPage()){
				break;
			}
			getPlayBaseUrl(function (playBaseUrl){
				iteratePlayButtons(function (_,p,e){
					let newButton=e.cloneNode(true);
					newButton.removeAttribute('onclick');
					let payload=e.attributes.onclick.value.replace('PlaySound','PlaySoundChrome');
					newButton.onclick=function (e){
						let PlaySoundChrome=(function (playBaseUrl){
							let html5Audio=document.createElement('audio');
							html5Audio.style="display: none;";
							document.body.appendChild(html5Audio);
							return function (src,id){
								let soundfile=playBaseUrl+src;
								html5Audio.src=soundfile;
								html5Audio.currentTime=0;
								html5Audio.volume=1;
								html5Audio.play();
								if(id){
									let count=e.srcElement.value;
									count=count.substring(count.indexOf('（')+1);
									count=count.substring(0, count.indexOf('次'));
									count=parseInt(count);
									count--;
									e.srcElement.value=`HTML5播放（${count}次机会）`;
									if(count<=0){
										e.srcElement.setAttribute('disabled','disabled');
									}
								}
							};
						})(playBaseUrl);
						eval(payload);
					};
					newButton.value=newButton.value.replace('播放','HTML5播放');
					p.appendChild(newButton);
				});
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
			getPlayBaseUrl(respond);
			break;
		default:
			console.error('Unknown operation!');
			console.log(message,sender);
			break;
	}
});
