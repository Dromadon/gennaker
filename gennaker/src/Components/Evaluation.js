import React, { Component } from 'react';
import { Question } from './Question';
import { generateEval } from '../Logic/EvaluationGenerator'

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
        const { error, isDataLoaded, isQuestionsReady, evaluation } = this.state;

        if (error) {
            return(<div>Error happened while loading content</div>);
        } else if (isQuestionsReady){
            return(
                <div>
                    <h2>Evaluation</h2>
                        {Object.keys(evaluation).map((category, index) => (
                            this.renderCategory(category, evaluation[category])
                        ))}
                </div>
            )
        } else if (isDataLoaded) {
            return(<div>Creating questions…</div>)
        } else {
            return(<div>Loading questions database…</div>)
        };
    };

    renderCategory(categoryName, sections) {
        return(
            <div>
                <h3>{categoryName}</h3>
                {Object.keys(sections).map((section, index) => (
                    this.renderSection(categoryName, section, sections[section])
                ))}
                <hr/>
            </div>
        )
    }

    renderSection(categoryName, sectionName, questions) {
        return(
            <div>
                <h4>{sectionName}</h4>
                {Object.keys(questions).map((question, index) => {
                    const filePath = "questions/" + categoryName + "/" + sectionName + "/" + questions[question]["fileName"]
                    return(
                        <Question filePath={filePath}/>
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