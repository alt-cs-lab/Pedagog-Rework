import * as React from 'react';
import './App.css';

import logo from './logo.svg';
import useWebSocket from 'react-use-websocket';

const socketUrl = 'ws://127.0.0.1:8000';

const {
  sendMessage,
  sendJsonMessage,
  lastMessage,
  lastJsonMessage,
  readyState,
  getWebSocket,
} = useWebSocket(socketUrl, {
  onOpen: () => console.log('opened'),
  shouldReconnect: (closeEvent) => true,
  onMessage: () => dataReceived,
});

class App extends React.Component {
  public render() {
    useWebSocket(socketUrl, {
      onOpen: () => {
        console.log('WebSocket connection established.');
      }
    });
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
      </div>
    );
  }
}

function dataReceived() {
  console.log('server is talking to you...');
  const { lastJsonMessage } = useWebSocket(socketUrl, {
    share: true,
  });
  if(lastJsonMessage != null)
  {
    //do stuff with data
    const data = lastJsonMessage;
    console.log(lastMessage);
  }
  sendJsonMessage(lastJsonMessage);
}

export default App;
