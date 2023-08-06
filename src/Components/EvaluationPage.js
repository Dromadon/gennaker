import React, { useRef, useState, useEffect, useCallback } from 'react';
import {produce} from "immer";

import { EvaluationLateralBar } from "./EvaluationLateralBar";

import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { useSearchParams } from 'react-router-dom';

import {useReactToPrint} from 'react-to-print';
import { Evaluation } from './Evaluation';

import { QuestionDatabase } from '../Infrastructure/QuestionsDatabase/QuestionDatabase';
import { EvaluationStructureMaker } from '../Infrastructure/EvaluationStructure/EvaluationStructureMaker';

function EvaluationPage(props) {

    const [searchParams] = useSearchParams();
    const [isQuestionsReady, setIsQuestionsReady] = useState(false);
    const [error] = useState(false);
    const [evalParameters] = useState({
        support: searchParams.get("support"),
        length: searchParams.get("length")
    });
    const [questionsDB] = useState(new QuestionDatabase())
    const [evaluation, setEvaluation] = useState({});
    const [displayCorrection, setDisplayCorrection] = useState(false);
    const [displayCategoryTitles, setDisplayCategoryTitle] = useState(true);
    const [displaySettings, setDisplaySettings] = useState({
        displayCorrection: false,
        displayCategoryTitles: true,
        displayAnswerSpace: false
    });

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: "Evaluation-"+evalParameters['support']+"-"+evalParameters['length']
    });

    const toggleDisplayAnswerSpace = (event) => {
        console.info("Switching answer space display in printing");
        setDisplaySettings({...displaySettings, displayAnswerSpace: !displaySettings.displayAnswerSpace});
    }

    const toggleDisplayCategoryTitles = (event) => {
        console.info("Switching category titles display");
        setDisplaySettings({...displaySettings, displayCategoryTitles: !displaySettings.displayCategoryTitles});
    }

    const toggleDisplayCorrection = (event) => {
        console.info("Switching correction display");
        setDisplaySettings({...displaySettings, displayCorrection: !displaySettings.displayCorrection});
    }

    const changeSectionQuestions = async (categoryName, sectionName) => {
        console.debug("Changing questions for category "+categoryName+" and section "+sectionName)
        //See the Immer doc https://immerjs.github.io/immer/async
        const newEvaluation = await produce(evaluation, async (draft) => {
            await draft.updateSectionQuestions({questionsDB: questionsDB, categoryName: categoryName, sectionName: sectionName})
        })
        setEvaluation(newEvaluation)
    }

    const changeAllQuestions = async () => {
        console.debug("Changing all questions")
        //See the Immer doc https://immerjs.github.io/immer/async
        const newEvaluation = await produce(evaluation, async (draft) => {
            await draft.updateAllQuestions({questionsDB: questionsDB})
        })
        setEvaluation(newEvaluation)
    }

    useEffect(() => {
        console.log("Creating evaluation object with questions")
        const evaluationStructureMaker = new EvaluationStructureMaker();

        const getEvaluation = async () => {
            console.debug("Creating new evaluation from evaluationStructureMaker");
            let evalStructure = await evaluationStructureMaker
                .generateStructure({support: evalParameters["support"], length: evalParameters["length"]});
            console.debug("Populating evaluation questions with QuestionsDatabase")
            const evaluationWithQuestions = await evalStructure.updateAllQuestions({questionsDB: questionsDB})

            console.debug("Resulting evaluation with questions is")
            console.debug(evaluationWithQuestions);

            setEvaluation(evaluationWithQuestions);
            setIsQuestionsReady(true);
        }
        getEvaluation();
    }, [props, evalParameters])

    console.log("EvaluationPage with parameters")
    console.log(evalParameters)

    if (error) {
        return(<div>Error happened while loading content</div>);
    } else if (isQuestionsReady){
        console.log("Rerendering!!")
        return(
            <Container fluid id="evaluationPage">
                <Row>
                    <Col xs={12} lg={2} className="lateralColumn">
                        <EvaluationLateralBar
                            evaluation={evaluation} 
                            displaySettings={displaySettings}
                            toggleDisplayCorrection={toggleDisplayCorrection}
                            toggleDisplayCategoryTitles={toggleDisplayCategoryTitles}
                            toggleDisplayAnswerSpace={toggleDisplayAnswerSpace}
                            handlePrint={handlePrint}
                            changeAllQuestions={changeAllQuestions}/>
                    </Col>
                    <Col sm={12} lg={10}>
                        <Evaluation id="evaluation" 
                            ref={componentRef}
                            evaluation={evaluation} 
                            evalParameters={evalParameters}
                            displaySettings={displaySettings}
                            changeSectionQuestions={changeSectionQuestions}/>
                    </Col>
                </Row>
            </Container>
        )
    } else {
        return(<div>Loading questions database…</div>)
    };
}

export {EvaluationPage}