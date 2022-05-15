import logo from './logo.svg';
import './App.css';
import React from 'react';
import { Evaluation } from './Components/Evaluation';

function App() {
  return (
    <div>
      <div className="App">
        <Evaluation />
      </div>
      <div>
        <h3>Made with love</h3>
      </div>
    </div>
  );
}

export default App;
