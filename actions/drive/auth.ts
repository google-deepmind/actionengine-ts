// Create an OAuth client ID at https://console.cloud.google.com/apis/credentials.
const OAUTH_CLIENT_ID = '';
const OAUTH_SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

function oauthSignIn() {
  var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  var form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauth2Endpoint);
  var params: Record<string, string> = {
		'client_id': OAUTH_CLIENT_ID,
		'redirect_uri': 'http://localhost:5432/examples/drive',
		'response_type': 'token',
		'scope': OAUTH_SCOPES.join(' '),
		'include_granted_scopes': 'true',
		'state': 'pass-through value'
	};
  for (var p in params) {
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();

}

export function maybeAuthenticate() {
	const fragmentString = location.hash.substring(1);
	const params: Record<string, string> = {};
	var regex = /([^&=]+)=([^&]*)/g, m;
	while (m = regex.exec(fragmentString)) {
		params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
	}
	if (Object.keys(params).length > 0 && params['state']) {
		const paramsJson = JSON.stringify(params);
		localStorage.setItem('oauth2-test-params', paramsJson);
	} else {
		oauthSignIn();
	}
}
