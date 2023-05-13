import * as React from 'react';
import './App.css';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

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
      <Box
      component="form"
      sx={{
        '& .MuiTextField-root': { m: 1, width: '25ch' },
      }}
      noValidate
      autoComplete="off"
    >
      <div>
        <TextField
          id="outlined-multiline-static"
          label="Code"
          multiline
          rows={4}
          defaultValue="Code something amazing!"
        />
      </div>
    </Box>
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
