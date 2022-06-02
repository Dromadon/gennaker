import React, { Component } from 'react';
import {Question} from './Question';
import Container from "react-bootstrap/Container"
import "./questionPrint.css"

class Evaluation extends Component {

    render(){
        return(
        <div>
        <Container id="evaluation" data-bs-spy="scroll" data-bs-target="#navbar-questions" data-bs-offset="0" tabindex="0">
        {Object.keys(this.props.evaluation).map((category) => (
                renderCategory(this.props.db, category, this.props.evaluation[category], this.props.displayCorrection)
            ))}
        </Container>
        </div>
        )
    }
}

function renderCategory(db, categoryName, sections, displayCorrection) {
    return(
        <Container id={"category-"+categoryName} fluid="lg">
            <h3>{db[categoryName]["meta"]["categoryDisplayName"]}</h3>
            {Object.keys(sections).map((section) => (
                renderSection(categoryName, section, sections[section], displayCorrection)
            ))}
            <hr/>
        </Container>
    )
}

function renderSection(categoryName, sectionName, questions, displayCorrection) {
    console.debug(questions)
    console.debug(Object.keys(questions))
    return(
        <div>
            {questions.map((question) => {
                const filePath = "/questions/" + categoryName + "/" + sectionName + "/" + question["fileName"]
                
                return(
                    <div class="rounded p-3 mb-2 bg-light">
                        <Question 
                            class="question" 
                            filePath={filePath} 
                            answerSize={question["answerSize"]}
                            displayCorrection={displayCorrection}/>
                    </div>
                )
            })}
        </div>
    )
}

export {Evaluation}