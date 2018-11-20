'use strict';

function getCurrentTabId(callback){
	chrome.tabs.query({
		active: true,
		currentWindow: true
	},function(tabs){
		if(callback){
			callback(tabs.length?tabs[0].id:null);
		}
	});
}

let showDownloadButton=function (){
	getCurrentTabId(function (tabId){
		chrome.tabs.sendMessage(tabId,{
			operation: 'showDownloadButton',
			from: 'popup'
		});
	});
},showHTMLPlayButton=function (){
	getCurrentTabId(function (tabId){
		chrome.tabs.sendMessage(tabId,{
			operation: 'showHTMLPlayButton',
			from: 'popup'
		});
	});
};

document.addEventListener('DOMContentLoaded',function (){
	document.getElementById('section-listening_show-all-download-link').onclick=showDownloadButton;
	document.getElementById('section-listening_show-html-play-button').onclick=showHTMLPlayButton;
	document.getElementById('version').textContent=chrome.runtime.getManifest().version;
	getCurrentTabId(function (tabId){
		chrome.tabs.sendMessage(tabId,{
			operation: 'isListeningPage',
			from: 'popup'
		},function (isListening){
			document.getElementById('is-on-listening').innerText=isListening?"已在当前页面检测到听力测试":"当前页面未检测到 NPELS 课程测试";
			document.getElementById('is-on-listening').classList.value=isListening?"green":"red";
			if(!isListening){
				return;
			}
			document.getElementById('section-listening').classList.remove('hide');
			chrome.tabs.sendMessage(tabId,{
				operation: 'getSoundFilenames',
				from: 'popup'
			},function (soundFileNames){
				document.getElementById('section-listening_filenum').textContent=soundFileNames.length.toString();
			});
		});
		chrome.tabs.sendMessage(tabId,{
			operation: 'isCoursePage',
			from: 'popup'
		},function (isCourse){
			document.getElementById('is-on-course').innerText=isCourse?"已在当前页面检测到课程学习":"当前页面未检测到 NPELS 课程学习";
			document.getElementById('is-on-course').classList.value=isCourse?"green":"red";
			if(!isCourse){
				return;
			}
			document.getElementById('section-course').classList.remove('hide');
			
		});
	});

	document.querySelectorAll('a.newtab').forEach(function (ln){
		ln.onclick=function (){
			chrome.tabs.create({
				active: true,
				url: ln.href
			});
		};
	});
});
