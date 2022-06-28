import React, { Component } from 'react';
import { Question } from './Question';

class Evaluation extends Component {

    render() {
        console.debug(process.env.PUBLIC_URL);
        return (
            <div className="mx-3 my-5">
                <h2 className="text-center">Évaluation théorique du niveau 4 FFV en {this.props.evalParameters["support"]}</h2>
                <p><em>Votre objectif est de répondre de façon synthétique aux questions, en expliquant les points qui vous semblent essentiels dans votre raisonnement. Une bonne réponse sans explication n’est pas comptabilisée, mais de manière générale, une réponse ne doit pas excéder quelques lignes. Un schéma est souvent le bienvenu.</em></p>
                <p className="text-center"><small><em>Cette évaluation a été générée par Gennaker </em>⛵</small></p>
                <div data-bs-spy="scroll" data-bs-target="#navbar-categories" data-bs-offset="0" tabindex="0">
                    {Object.keys(this.props.evaluation).map((category) => (
                        renderCategory(this.props.db, category, this.props.evaluation[category], this.props.displayCorrection, this.props.displayCategoryTitles)
                    ))}
                </div>
            </div>
        )
    }
}

function renderCategory(db, categoryName, sections, displayCorrection, displayCategoryTitles) {
    return (
        <div className="mt-5">
            { displayCategoryTitles &&
                <div class="categoryTitle">
                    <h3 id={"category-" + categoryName}>{db[categoryName]["meta"]["categoryDisplayName"]}</h3>
                </div>
            }
            {Object.keys(sections).map((sectionName) => (
                sections[sectionName].map((question) => {
                    const filePath = process.env.PUBLIC_URL + "/questions/" + categoryName + "/" + sectionName + "/" + question["fileName"]
                    console.debug(filePath);
                    return (
                        <Question
                            filePath={filePath}
                            answerSize={question["answerSize"]}
                            displayCorrection={displayCorrection} />
                    )
                })
                // renderSection(categoryName, sectionName, sections[section], displayCorrection)
                // To be assessed
            ))}
        </div>
    )
}

/*
function renderSection(categoryName, sectionName, questions, displayCorrection) {

    return (
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
}
//*/

export { Evaluation }