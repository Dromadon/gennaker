import logo from './logo.svg';
import './App.css';
import React from 'react';
import { EvaluationPage } from './Components/EvaluationPage';
import { Navigation } from './Components/Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes } from "react-router-dom";

import Settings from './Components/Settings';
import About from './Components/About';

function App() {
  return (
    <div>
      <Navigation/>
      <Routes>
        <Route path="/" element={<Settings/>}/>
        <Route path="/evaluation" element={<EvaluationPage support="catamaran" evalStructure="evaluations/catamaran.json"/>} />
        <Route path="/about" element={<About/>}/>
      </Routes>
    </div>
  );
}

export default App;
