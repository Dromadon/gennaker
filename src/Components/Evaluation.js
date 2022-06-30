import React, { Component } from 'react';
import { Question } from './Question';

const Evaluation = React.forwardRef(({db, evaluation, evalParameters, displayCorrection, displayCategoryTitles }, ref) => (
    <div ref={ref} className="mx-3 my-5">
        <h2 className="text-center">Évaluation théorique du niveau 4 FFV en {evalParameters["support"]}</h2>
        <p><em>Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</em></p>
        <p className="text-center"><small><em>Cette évaluation a été générée par Gennaker </em>⛵</small></p>
        <div data-bs-spy="scroll" data-bs-target="#navbar-categories" data-bs-offset="0" tabindex="0">
            {Object.keys(evaluation).map(category => (
                <Category 
                db={db}
                categoryName={category}
                sections={evaluation[category]}
                displayCorrection={displayCorrection}
                displayCategoryTitles={displayCategoryTitles}/>
            ))}
        </div>
    </div>
))

const Category = ({db, categoryName, sections, displayCorrection, displayCategoryTitles}) => (
    <div className="mt-5">
        { displayCategoryTitles &&
            <div class="categoryTitle">
                <h3 id={"category-" + categoryName}>{db[categoryName]["meta"]["categoryDisplayName"]}</h3>
            </div>
        }
        {Object.keys(sections).map((sectionName) => (
            <Section 
                categoryName={categoryName}
                sectionName={sectionName}
                questions={sections[sectionName]}
                displayCorrection={displayCorrection} />
        ))}
    </div>
)


const Section = ({categoryName, sectionName, questions, displayCorrection}) => (
    <div>
        {questions.map((question) => {
            const filePath = process.env.PUBLIC_URL + "/questions/" + categoryName + "/" + sectionName + "/" + question["fileName"]
            console.debug(filePath);
            return (
                <Question
                    filePath={filePath}
                    answerSize={question["answerSize"]}
                    displayCorrection={displayCorrection} />
            )
        })}
    </div>
)


export { Evaluation }