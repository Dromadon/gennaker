import React, { useRef, useState, useEffect, useCallback } from 'react';
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
    const [evaluation, setEvaluation] = useState({});
    const [displayCorrection, setDisplayCorrection] = useState(false);
    const [displayCategoryTitles, setDisplayCategoryTitle] = useState(true);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: "Evaluation-"+evalParameters['support']+"-"+evalParameters['length']
    });

    const toggleDisplayCorrection = (event) => {
        console.info("Switching correction display");
        setDisplayCorrection(!displayCorrection);
    }

    const toggleDisplayCategoryTitles = (event) => {
        console.info("Switching category titles display");
        setDisplayCategoryTitle(!displayCategoryTitles);
    }

    useEffect(() => {
        console.log("Creating evaluation object with questions")
        const db = new QuestionDatabase();
        const evaluationStructureMaker = new EvaluationStructureMaker();

        const getEvaluation = async () => {
            console.debug("Creating new evaluation from evaluationStructureMaker");
            let evalStructure = await evaluationStructureMaker
                .generateStructure({support: evalParameters["support"], length: evalParameters["length"]});
            console.debug("Population evaluation questions with QuestionsDatabase")
            const evaluationWithQuestions = await evalStructure.updateAllQuestions({questionsDB: db})

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
        return(
            <Container fluid id="evaluationPage">
                <Row>
                    <Col xs={12} lg={2} className="lateralColumn">
                        <EvaluationLateralBar
                            evaluation={evaluation} 
                            displayCorrection={displayCorrection} 
                            displayCategoryTitles={displayCategoryTitles}
                            toggleDisplayCorrection={toggleDisplayCorrection}
                            toggleDisplayCategoryTitles={toggleDisplayCategoryTitles}
                            handlePrint={handlePrint}/>
                    </Col>
                    <Col sm={12} lg={10}>
                        <Evaluation id="evaluation" 
                            ref={componentRef}
                            evaluation={evaluation} 
                            evalParameters={evalParameters}
                            displayCorrection={displayCorrection}
                            displayCategoryTitles={displayCategoryTitles}/>
                    </Col>
                </Row>
            </Container>
        )
    } else {
        return(<div>Loading questions database…</div>)
    };
}

/*
const loadQuestionDBAndEvalStructure = useCallback(async (support, length) => {
    const db = new QuestionDatabase();
    const evaluationStructureMaker = new EvaluationStructureMaker();
    const evalStructure = await evaluationStructureMaker.generateStructure({support: support, length: length});

    return [db, evalStructure];
}, [])
*/






export {EvaluationPage}