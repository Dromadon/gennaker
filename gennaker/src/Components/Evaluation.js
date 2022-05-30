import React, { Component } from 'react';
import { Question } from './Question';
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import { Navbar } from 'react-bootstrap';

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
            "evaluation": {}
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
                        <Container data-bs-spy="scroll" data-bs-target="#navbar-example3" data-bs-offset="0" tabindex="0">
                            {Object.keys(evaluation).map((category) => (
                                this.renderCategory(category, evaluation[category])
                            ))}
                        </Container>
                    </Col>
                    <Col sm={12} md={2}></Col>
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
                <h3>{this.state.db[categoryName]["meta"]["category_name"]}</h3>
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
                    const filePath = "questions/" + categoryName + "/" + sectionName + "/" + questions[question]["fileName"]
                    return(
                        <div class="rounded p-3 mb-2 bg-light">
                            <Question filePath={filePath}/>
                        </div>
                    )
                })}
            </div>
        )
    }

    renderNavBar(db, evaluation) {
        return(
            <Navbar sticky="top">
            <nav id="navbar-example3" class="navbar navbar-light bg-light flex-column align-items-stretch p-3">
                <a class="navbar-brand" href="#">Catégories</a>
                <nav class="nav nav-pills flex-column">
                    {Object.keys(evaluation).map((category) => { 
                        const categoryDisplayName = db[category]["meta"]["category_name"]
                        return(<a class="nav-link" href={"category-"+category}>{categoryDisplayName}</a>)})}
                </nav>
            </nav>
            </Navbar>
        )
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