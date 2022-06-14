import React, { Component } from 'react';
import {Question} from './Question';
import Container from "react-bootstrap/Container"
import {Row} from "react-bootstrap";

class Evaluation extends Component {

    render(){
        console.debug(process.env.PUBLIC_URL);
        return(
        <div>
        <Container fluid id="evaluation" data-bs-spy="scroll" data-bs-target="#navbar-questions" data-bs-offset="0" tabindex="0">
        <Row className="justify-content-center mt-5">
            <h2 className="text-center">Evaluation théorique du niveau 4 FFV en {this.props.evalParameters["support"]}</h2>
            <p><em>Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</em></p>
        </Row>
        <Row>
        {Object.keys(this.props.evaluation).map((category) => (
                renderCategory(this.props.db, category, this.props.evaluation[category], this.props.displayCorrection)
            ))}
            </Row>
        </Container>
        </div>
        )
    }
}

function renderCategory(db, categoryName, sections, displayCorrection) {
    return(
        <Container id={"category-"+categoryName} fluid="lg" className="mt-3">
            <h3 className="categoryTitle">{db[categoryName]["meta"]["categoryDisplayName"]}</h3>
            {Object.keys(sections).map((section) => (
                renderSection(categoryName, section, sections[section], displayCorrection)
            ))}
        </Container>
    )
}

function renderSection(categoryName, sectionName, questions, displayCorrection) {

    return(
        <div>
            {questions.map((question) => {
                const filePath = process.env.PUBLIC_URL + "/questions/" + categoryName + "/" + sectionName + "/" + question["fileName"]
                console.debug(filePath);
                return(
                        <Question 
                            filePath={filePath} 
                            answerSize={question["answerSize"]}
                            displayCorrection={displayCorrection}/>
                )
            })}
        </div>
    )
}

export {Evaluation}