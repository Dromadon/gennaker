import React, { useRef, useState, useEffect } from 'react';
import { EvaluationLateralBar } from "./EvaluationLateralBar";

import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { useSearchParams } from 'react-router-dom';

import {useReactToPrint} from 'react-to-print';
import { Evaluation } from './Evaluation';

import { QuestionDatabase } from '../Infrastructure/QuestionsDatabase/QuestionsDatabase';
import { EvaluationStructureMaker } from '../Infrastructure/EvaluationStructure/EvaluationStructureMaker';

function EvaluationPage(props) {
    const [searchParams] = useSearchParams();
    console.log(searchParams.get("support"))

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isQuestionsReady, setIsQuestionsReady] = useState(false);
    const [error] = useState(false);
    const [db, setDB] = useState({});
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
        loadQuestionDBAndEvalStructure(evalParameters["support"], evalParameters["length"]).then(([db, evalStructure]) => {
            console.debug("DB and structure fetched");
            setIsDataLoaded(true);
            setDB(db);
            setEvaluation(evalStructure);
            //setEvaluation(generateEval(db, evalStructure, evalParameters));
            setIsQuestionsReady(true);
        })
    }, [props, evalParameters])

    if (error) {
        return(<div>Error happened while loading content</div>);
    } else if (isQuestionsReady){
        console.log("In EvaluationPage.js, evaluation is ")
        console.log(evaluation);
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
    } else if (isDataLoaded) {
        return(<div>Creating questions…</div>)
    } else {
        return(<div>Loading questions database…</div>)
    };
}

async function loadQuestionDBAndEvalStructure(support, length) {
    const db = new QuestionDatabase();

    const evaluationStructureMaker = new EvaluationStructureMaker();
    const evalStructure = await evaluationStructureMaker.generateStructure({support: support, length: length});
    console.log(evalStructure);

    return [db, evalStructure];
}






export {EvaluationPage}