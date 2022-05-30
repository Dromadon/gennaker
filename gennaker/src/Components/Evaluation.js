import React, { Component } from 'react';
import { Question } from './Question';
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import { Navbar, Nav } from 'react-bootstrap';
import { NavHashLink } from 'react-router-hash-link';

class Evaluation extends Component {

    constructor(props) {
        super(props);        
        this.state = {
            "isDataLoaded": false,
            "isQuestionsReady": false,
            "error": false,
            "db": {},
            "evalStructure": {},
            "evalParameters": {
                "support": "catamaran"
            },
            "evaluation": {},
            "displayCorrection": false
        }
    }

    componentDidMount() {
        this.loadQuestionDBAndEvalStructure().then(([db, evalStructure]) => {
            console.debug("DB and structure fetched");
            this.setState({
                "isDataLoaded": true,
                "db": db,
                "evalStructure": evalStructure
            });
            this.setState({
                "evaluation": generateEval(db, evalStructure, this.state.evalParameters),
                "isQuestionsReady": true
            })
        })
    }

    render() {
        const { error, isDataLoaded, isQuestionsReady, evaluation, evalParameters, db } = this.state;
        const support = evalParameters["support"]
        if (error) {
            return(<div>Error happened while loading content</div>);
        } else if (isQuestionsReady){
            return(
                <Container>
                    <Row className="justify-content-center mt-5">
                        <Col sm={8}>
                            <h2 className="text-center">Evaluation théorique du niveau 4 FFV en {support}</h2>
                            <p className="lead">Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={12} md={2}>
                            {this.renderNavBar(db, evaluation)}
                        </Col>
                        <Col sm={12} md={8}>
                            <Container data-bs-spy="scroll" data-bs-target="#navbar-questions" data-bs-offset="0" tabindex="0">
                                {Object.keys(evaluation).map((category) => (
                                    this.renderCategory(category, evaluation[category])
                                ))}
                            </Container>
                        </Col>
                        <Col sm={12} md={2}>
                            <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" onChange={this.toggleCorrectionDisplay}/>
                            <label class="form-check-label" for="flexSwitchCheckDefault">Afficher les corrections</label>
                            </div>
                        </Col>
                    </Row>
                </Container>
            )
        } else if (isDataLoaded) {
            return(<div>Creating questions…</div>)
        } else {
            return(<div>Loading questions database…</div>)
        };
    };

    renderCategory(categoryName, sections) {
        return(
            <Container id={"category-"+categoryName} fluid="lg">
                <h3>{this.state.db[categoryName]["meta"]["categoryDisplayName"]}</h3>
                {Object.keys(sections).map((section) => (
                    this.renderSection(categoryName, section, sections[section])
                ))}
                <hr/>
            </Container>
        )
    }

    renderSection(categoryName, sectionName, questions) {
        return(
            <div>
                {Object.keys(questions).map((question, index) => {
                    const filePath = "/questions/" + categoryName + "/" + sectionName + "/" + questions[question]["fileName"]
                    return(
                        <div class="rounded p-3 mb-2 bg-light">
                            <Question filePath={filePath} displayCorrection={this.state.displayCorrection}/>
                        </div>
                    )
                })}
            </div>
        )
    }

    renderNavBar(db, evaluation) {
        return(
            <Navbar id="navbar-questions" sticky="top" bg="light" color="light" className="flex-column align-items-strech p-3">
                <a class="navbar-brand" href="#">Catégories</a>
                <Nav class="nav nav-pills flex-column">
                    {Object.keys(evaluation).map((category) => { 
                        const categoryDisplayName = db[category]["meta"]["categoryDisplayName"]
                        return(<NavHashLink activeStyle={{ color: 'red' }} class="nav-link" to={"#category-"+category}>{categoryDisplayName}</NavHashLink>)})}
                </Nav>
            </Navbar>
        )
    }

    toggleCorrectionDisplay = (event) => {
        this.setState({"displayCorrection": !this.state.displayCorrection});
    }

    async loadQuestionDBAndEvalStructure() {
        const [dbResponse, evalStructureResponse] = await Promise.all([
            fetch(process.env.PUBLIC_URL +"/questions/db.json", {
            // This is needed for local access sadly
                headers : { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                    }
            }),
            fetch(process.env.PUBLIC_URL + "/evaluations/catamaran.json", {
            // This is needed for local access sadly
                headers : { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                    }
            })
        ])

        const db = await dbResponse.json();
        const evalStructure = await evalStructureResponse.json();

        return [db, evalStructure];
    }
}

export {Evaluation}