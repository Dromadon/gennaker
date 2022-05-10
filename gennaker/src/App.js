import logo from './logo.svg';
import './App.css';
import React from 'react';
import {Question} from './Components/Question';

function App() {
  console.log(process.env.REACT_APP_BASE_IMAGE_URL);
  return (
    <div className="App">
      <Question filePath="questions/meteo/Evolution_vent_sous_grain.md" />
    </div>
  );
}

export default App;
