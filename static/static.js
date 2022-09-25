function MsgBox(str, ok, cancel) {
	if (ok == undefined && cancel == undefined) {
		alert(str);
	} else {
		if (confirm(str)) {
			if (ok != undefined) ok();
		} else {
			if (cancel != undefined) cancel();
		}
	}
}

//network functions
async function PostVanisherServer(api, jsonObj, callback) {
	const response = await fetch(VANISHER_API_ENDPOINT + "/" + api, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'mode': 'no-cors'
		},
		body: JSON.stringify(jsonObj)
	});

	response.json().then(data => {
		console.log(data);
		callback(data);
	});
}