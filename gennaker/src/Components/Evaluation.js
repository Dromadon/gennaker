import React from 'react';
import { Question } from './Question';
import { EvaluationGenerator } from '../Logic/EvaluationGenerator'

function Evaluation (props) {
    
    // Generate eval with parameters

    // Display with loop over questions (and/or categories)

    return (
        <div>
            <h2>Evaluation</h2>
            <Question filePath="questions/meteo/Evolution_vent_sous_grain.md" />
            <Question filePath="questions/meteo/incontournables/etablissement_brise_thermique.md" />
        </div>
    )
}

export {Evaluation}