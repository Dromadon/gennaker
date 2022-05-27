import React, { Component } from 'react';
import { Question } from './Question';
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"

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
        const { error, isDataLoaded, isQuestionsReady, evaluation, evalParameters } = this.state;
        const support = evalParameters["support"]
        if (error) {
            return(<div>Error happened while loading content</div>);
        } else if (isQuestionsReady){
            return(
                <Row>
                    <Col sm={2}></Col>
                    <Col>
                        <Container className="">
                            <h2 className="text-center mt-5">Evaluation théorique du niveau 4 FFV en {support}</h2>
                            <p className="lead">Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</p>
                            {Object.keys(evaluation).map((category, index) => (
                                this.renderCategory(category, evaluation[category])
                            ))}
                        </Container>
                    </Col>
                    <Col sm={2}></Col>
                </Row>
            )
        } else if (isDataLoaded) {
            return(<div>Creating questions…</div>)
        } else {
            return(<div>Loading questions database…</div>)
        };
    };

    renderCategory(categoryName, sections) {
        return(
            <Container fluid="lg">
                <h3>{this.state.db[categoryName]["meta"]["category_name"]}</h3>
                {Object.keys(sections).map((section, index) => (
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