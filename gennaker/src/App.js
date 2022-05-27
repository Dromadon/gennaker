import logo from './logo.svg';
import './App.css';
import React from 'react';
import { Evaluation } from './Components/Evaluation';
import { Navigation } from './Components/Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

import Container from "react-bootstrap/Container"

function App() {
  return (
    <div>
      <Navigation/>
      <Container>
        <Evaluation support="catamaran" evalStructure="evaluations/catamaran.json"/>
      </Container>
    </div>
  );
}

export default App;
