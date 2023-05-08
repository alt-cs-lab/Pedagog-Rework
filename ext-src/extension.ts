import * as path from 'path';
import * as vscode from 'vscode';

/**
 * This is webSocket server side stuff, all on localHost so http is secure enough
 */
const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv = require('uuid').v4; //for unique user ID's probably not needed

//spinning http server into webSocket server
const server = http.createServer(); //http server to use
const wsServer = new WebSocketServer({ server }); //socket on http server to send/receive messages
const port = 8000; //port that matches client
server.listen(port, () => { //tells server to listen on 'port' logs if successful
	console.log(`WebSocket server is running on port ${port}`);
});

// let client = new WebSocket();

//handle client connection
wsServer.on('connection', function(connection) {
	console.log('Client connecting to server...');
	
	//store the new connection and attach events
	const client = connection;
	console.log('Client is connected to server ws://127.0.0.1:8000');
	connection.on('message', (message) => handleMessage(message));
	connection.on('close', () => handleDisconnect());
})

//Message from client
function handleMessage(message) {
	const dataFromClient = JSON.parse(message.toString());
	if(dataFromClient != null) {
		//do stuff with data
	}
	//broadcast message json message with data needed back to client
	const json = { dataFromClient }; //just sends back same data as received right now
//	broadcastMessage(json);
}

//function to handle disconnect of client
function handleDisconnect() {
	console.log('Client has disconnected from server');

}

//function to broadcast message to client
//function broadcastMessage(json) {
//	const data = JSON.stringify(json); //convert JSON object into string
//	if(client.readyState == WebSocket.OPEN) { //check if client is ready for message
//		client.send(data); //send the message
//	}
//}

/**
 * End of WebSocket server stuff
 */

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('react-webview.start', () => {
		ReactPanel.createOrShow(context.extensionPath);
	}));

	// Opens preview window on extension startup by using react-webview.start
	vscode.commands.executeCommand('react-webview.start');

}

/**
 * Manages react webview panels
 */
class ReactPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: ReactPanel | undefined;

	private static readonly viewType = 'react';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If we already have a panel, show it.
		// Otherwise, create a new panel.
		if (ReactPanel.currentPanel) {
			ReactPanel.currentPanel._panel.reveal(column);
		} else {
			ReactPanel.currentPanel = new ReactPanel(extensionPath, vscode.ViewColumn.Two);
		}
	}

	private constructor(extensionPath: string, column: vscode.ViewColumn.Two) {
		this._extensionPath = extensionPath;

		// Create and show a new webview panel
		this._panel = vscode.window.createWebviewPanel(ReactPanel.viewType, "React", {viewColumn:column, preserveFocus:true}, {
			
			// Enable javascript in the webview
			enableScripts: true,

			// And restric the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [
				vscode.Uri.file(path.join(this._extensionPath, 'build'))
			]
		});
		
		// Set the webview's initial html content 
		this._panel.webview.html = this._getHtmlForWebview();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		ReactPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _getHtmlForWebview() {
		const manifest = require(path.join(this._extensionPath, 'build', 'asset-manifest.json'));
		const mainScript = manifest['files']['main.js'];
		const mainStyle = manifest['files']['main.css'];

		const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainScript));
		const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
		const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainStyle));
		const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${vscode.Uri.file(path.join(this._extensionPath, 'build')).with({ scheme: 'vscode-resource' })}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
