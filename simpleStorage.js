simpleStorage={
	put: function (key,value){
		chrome.runtime.sendMessage({
			from: 'simpleStorage',
			operation: 'simpleStorage.put',
			data: {
				key: key,
				value: value
			}
		});
	},
	get: function (key,callback){
		chrome.runtime.sendMessage({
			from: 'simpleStorage',
			operation: 'simpleStorage.get',
			data: {
				key: key
			}
		},callback);
	}
};
