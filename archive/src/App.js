import React from 'react';
import { EvaluationPage } from './Components/EvaluationPage';
import { Navigation } from './Components/Navigation';
import { EvaluationStructure } from './Components/EvaluationStructure';
import { QuestionsDatabaseDisplay } from './Components/QuestionsDatabaseDisplay';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Routes } from "react-router-dom";

import Settings from './Components/Settings';
import About from './Components/About';
import './App.scss';

function App() {
  return (
    <div>
      <Navigation />
      <Routes>
        <Route path="/" element={<Settings/>}/>
        <Route path="/settings" element={<Settings/>}/>
        <Route path="/evaluation" element={<EvaluationPage/>} />
        <Route path="/evaluationstructure" element={<EvaluationStructure/>} />
        <Route path="/questionsdatabasedisplay" element={<QuestionsDatabaseDisplay/>} />
        <Route path="/about" element={<About/>}/>
      </Routes>
    </div>
  );
}

export default App;
