import React, { Component } from 'react';
import { Question } from './Question';

import {Button} from "react-bootstrap";


const Evaluation = React.forwardRef(({evaluation, evalParameters, displaySettings, changeSectionQuestions }, ref) => (
    <div ref={ref} className="mx-3 my-5">
        <h2 className="text-center">Évaluation théorique du niveau 4 FFV en {evalParameters["support"]}</h2>
        <p><em>Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</em></p>
        <p className="text-center"><small><em>Cette évaluation a été générée par Gennaker </em>⛵</small></p>
        <div>
            {evaluation.getCategories().map(([categoryName, category]) => (
                <Category 
                categoryName={categoryName}
                category={category}
                displaySettings={displaySettings}
                changeSectionQuestions={changeSectionQuestions}/>
            ))}
        </div>
    </div>
))

const Category = ({categoryName, category, displaySettings, changeSectionQuestions}) => {
    console.log("Displaying category "+categoryName)

    return(
    <div>
        <div class={"categoryTitle mt-4 px-2" + (displaySettings.displayCategoryTitles ? '' : ' d-print-none')}>
            <h4 id={"category-" + categoryName}>{category.displayName}</h4>
        </div>
        {category.getSections().map(([sectionName, section]) => (
            <Section 
                categoryName={categoryName}
                sectionName={sectionName}
                section={section}
                displaySettings={displaySettings}
                changeSectionQuestions={changeSectionQuestions}/>
        ))}
    </div>)
}

const Section = ({categoryName, sectionName, section, displaySettings, changeSectionQuestions}) => {
    console.log("Displaying section "+sectionName+" in category "+categoryName)

    return(
    <div className="mt-3">
        <div className="sectionTitle mt-4 mb-1 px-2 d-flex d-print-none">
            <h5 className="flex-fill" id={"section-" + categoryName + "-" + sectionName}>{section.displayName}</h5>
            <div className="changeQuestionButton"><Button onClick={() => changeSectionQuestions(categoryName, sectionName)} size="sm" variant="success"><i class="bi bi-arrow-clockwise"></i></Button></div>
        </div>
        {
        section.questions.map((question) => {
            const filePath = process.env.PUBLIC_URL + "/questions/" + question["fileName"]
            return (
                <Question
                    filePath={filePath}
                    answerSize={question.answerSize}
                    displaySettings={displaySettings} />
            )
        })}
    </div>)
}


export { Evaluation }