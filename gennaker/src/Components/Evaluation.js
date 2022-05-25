import React from 'react';
import { Question } from './Question';
import { EvaluationGenerator } from '../Logic/EvaluationGenerator'

function Evaluation (props) {
    
    // Generate eval with parameters -> in constructor ?

    // Display with loop over questions (and/or categories)
    // for each question, build filePath with category, section, and fileName

    return (
        <div>
            <h2>Evaluation</h2>
            <Question filePath="questions/meteo/phenomene_local/evolution_vent_sous_grain.md" />
            <Question filePath="questions/meteo/incontournables/etablissement_brise_thermique.md" />
        </div>
    )
}

export {Evaluation}