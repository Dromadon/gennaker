import React, { Component } from 'react';
import { Question } from './Question';
import { generateEval } from '../Logic/EvaluationGenerator'

class Evaluation extends Component {

    constructor(props) {
        super(props);        
        this.state = {
            "isDBLoaded": false,
            "isStructureLoaded": false,
            "isQuestionsReady": false,
            "error": false,
            "db": {},
            "evalStructure": {},
            "evalParameters": {
                "support": "catamaran"
            },
            "questions": {}
        }
    }

    componentDidMount() {
        this.loadQuestionDB();
        this.loadEvalStructure();
    }

    render() {
        const { error, isDBLoaded, isStructureLoaded, isQuestionsReady } = this.state;

        if (isDBLoaded & isStructureLoaded) {
            console.debug("Generating questions");
            this.setState({
                "questions": generateEval(this.state.db, this.state.evalStructure, this.state.evalParameters),
                "isQuestionsReady": true
            })
        }

        if (error) {
            return(<div>Error happened while loading content</div>);
        } else if (isQuestionsReady){
            return(
                <div>
                    <h2>Evaluation</h2>
                    <Question filePath="questions/meteo/phenomene_local/evolution_vent_sous_grain.md" />
                    <Question filePath="questions/meteo/incontournables/etablissement_brise_thermique.md" />
                </div>
            )
        } else if (isStructureLoaded) {
            return(<div>Creating questions…</div>)
        } else if (isDBLoaded) {
            return(<div>Loading eval parameters…</div>)
        } else {
            return(<div>Loading questions database…</div>)
        };
    };

    loadQuestionDB() {
        return(fetch("http://localhost:3000/questions/db.json", {
            // This is needed for local access sadly
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            })
            .then(response => response.json()))
            .then(responseJSON => { this.setState({
                    "db": responseJSON,
                    "isDBLoaded": true
                })
            })
    }

    loadEvalStructure() {
        fetch("http://localhost:3000/evaluations/catamaran.json", {
            // This is needed for local access sadly
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            })
            .then(response => response.json())
            .then(responseJSON => { this.setState({
                "evalStructure": responseJSON,
                "isStructureLoaded": true
            })
        })
    }


    
}

export {Evaluation}