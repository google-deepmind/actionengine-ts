/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


// Create an OAuth client ID at https://console.cloud.google.com/apis/credentials.
let OAUTH_CLIENT_ID = '';
const OAUTH_SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

function oauthSignIn() {
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  const form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauth2Endpoint);
  if (!OAUTH_CLIENT_ID) {
	OAUTH_CLIENT_ID = prompt("Google OAuth client");
  } 
  const params: Record<string, string> = {
		'client_id': OAUTH_CLIENT_ID,
		// TODO: update with the URL if this is hosted persistently.
		// Register the domain under "Authorized JavaScript origins" and
		// "Authorized redirect URIs" in the Google Cloud console.
		'redirect_uri': 'http://localhost:5432/examples/drive',
		'response_type': 'token',
		'scope': OAUTH_SCOPES.join(' '),
		'include_granted_scopes': 'true',
		'state': 'pass-through value'
	};
  for (const [k,v] of Object.entries(params)) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', k);
    input.setAttribute('value', v);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();

}

let authTried: boolean = false;

export function maybeAuthenticate() {
	if (authTried) {
		return;
	}
	authTried = true;
	const fragmentString = location.hash.substring(1);
	const params: Record<string, string> = {};
	const regex = /([^&=]+)=([^&]*)/g;
	let m: RegExpExecArray | null = null;
	while ((m = regex.exec(fragmentString)) !== null) {
		params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
	}
	if (Object.keys(params).length > 0 && params['state']) {
		const paramsJson = JSON.stringify(params);
		localStorage.setItem('oauth2-test-params', paramsJson);
	} else {
		oauthSignIn();
	}
}
