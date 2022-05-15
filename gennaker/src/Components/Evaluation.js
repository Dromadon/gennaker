import React from 'react';
import { Question } from './Question';

function Evaluation (props) {
    
    return (
        <div>
            <Question filePath="questions/Meteo/Evolution_vent_sous_grain.md" />
            <Question filePath="questions/Meteo/incontournables/etablissement_brise_thermique.md" />
        </div>
    )
}

export {Evaluation}