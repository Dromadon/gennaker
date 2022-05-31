import React, { Component } from 'react';
import {Question} from './Question';
import Container from "react-bootstrap/Container"

class Evaluation extends Component {

    constructor(props) {
        super(props);  
        this.db = props.db;
        this.evaluation = props.evaluation;
        this.displayCorrection = props.displayCorrection; 
        //Does not update as it is not state TOFIX     
    }

    render(){
        return(
        <div>
        <Container  data-bs-spy="scroll" data-bs-target="#navbar-questions" data-bs-offset="0" tabindex="0">
        {Object.keys(this.evaluation).map((category) => (
                renderCategory(this.db, category, this.evaluation[category], this.displayCorrection)
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
    return(
        <div>
            {Object.keys(questions).map((question, index) => {
                const filePath = "/questions/" + categoryName + "/" + sectionName + "/" + questions[question]["fileName"]
                return(
                    <div class="rounded p-3 mb-2 bg-light">
                        <Question filePath={filePath} displayCorrection={displayCorrection}/>
                    </div>
                )
            })}
        </div>
    )
}

export {Evaluation}