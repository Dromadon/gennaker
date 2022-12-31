import React, { Component } from 'react';
import { Question } from './Question';

const Evaluation = React.forwardRef(({evaluation, evalParameters, displayCorrection, displayCategoryTitles }, ref) => (
    <div ref={ref} className="mx-3 my-5">
        <h2 className="text-center">Évaluation théorique du niveau 4 FFV en {evalParameters["support"]}</h2>
        <p><em>Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</em></p>
        <p className="text-center"><small><em>Cette évaluation a été générée par Gennaker </em>⛵</small></p>
        <div data-bs-spy="scroll" data-bs-target="#navbar-categories" data-bs-offset="0" tabindex="0">
            {evaluation.getCategories().map(([categoryName, category]) => (
                <Category 
                categoryName={categoryName}
                category={category}
                displayCorrection={displayCorrection}
                displayCategoryTitles={displayCategoryTitles}/>
            ))}
        </div>
    </div>
))

const Category = ({categoryName, category, displayCorrection, displayCategoryTitles}) => {
    console.log("Displaying category "+categoryName)

    return(
    <div className="mt-5">
        { displayCategoryTitles &&
            <div class="categoryTitle">
                <h3 id={"category-" + categoryName}>{category.displayName}</h3>
            </div>
        }
        {category.getSections().map(([sectionName, section]) => (
            <Section 
                categoryName={categoryName}
                sectionName={sectionName}
                section={section}
                displayCorrection={displayCorrection}
                displayCategoryTitles={displayCategoryTitles} />
        ))}
    </div>)
}

const Section = ({categoryName, sectionName, section, displayCorrection, displayCategoryTitles}) => {
    console.log("Displaying section "+sectionName+" in category "+categoryName)

    return(
    <div>
        { displayCategoryTitles && 
                <div class="sectionTitle">
                    <h4 id={"section-" + categoryName + "-" + sectionName}>{section.displayName}</h4>
                </div> }
        {
        section.questions.map((question) => {
            const filePath = process.env.PUBLIC_URL + "/questions/" + question["fileName"]
            return (
                <Question
                    filePath={filePath}
                    answerSize={question.answerSize}
                    displayCorrection={displayCorrection} />
            )
        })}
    </div>)
}


export { Evaluation }