import React, { useRef, useState, useEffect } from 'react';
import { Evaluation } from './Evaluation';
import { EvaluationLateralBar } from "./EvaluationLateralBar";
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"

import { useSearchParams } from 'react-router-dom';

import {useReactToPrint} from 'react-to-print';

function EvaluationPage(props) {
    const [searchParams] = useSearchParams();
    console.log(searchParams.get("support"))

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isQuestionsReady, setIsQuestionsReady] = useState(false);
    const [error] = useState(false);
    const [db, setDB] = useState({});
    const [evalStructure, setEvalStructure] = useState({});
    const [evalParameters] = useState({
        support: searchParams.get("support"),
        length: searchParams.get("length")
    });
    const [evaluation, setEvaluation] = useState({});
    const [displayCorrection, setDisplayCorrection] = useState(false);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    const toggleCorrectionDisplay = (event) => {
        console.info("Switching correction display");
        setDisplayCorrection(!displayCorrection);
    }

    useEffect(() => {
        loadQuestionDBAndEvalStructure().then(([db, evalStructure]) => {
            console.debug("DB and structure fetched");
            setIsDataLoaded(true);
            setDB(db);
            setEvalStructure(evalStructure);
            setEvaluation(generateEval(db, evalStructure, evalParameters));
            setIsQuestionsReady(true);
        })
    }, [props, evalParameters])

    if (error) {
        return(<div>Error happened while loading content</div>);
    } else if (isQuestionsReady){
        return(
            <Container fluid id="evaluationPage">
                <Row>
                    <Col xs={12} lg={2} className="lateralColumn">
                        <EvaluationLateralBar
                            db={db} 
                            evaluation={evaluation} 
                            displayCorrection={displayCorrection} 
                            toggleCorrectionDisplay={toggleCorrectionDisplay}
                            handlePrint={handlePrint}/>
                    </Col>
                    <Col sm={12} lg={10}>
                        <Evaluation id="evaluation" 
                            ref={componentRef}
                            db={db} evaluation={evaluation} 
                            evalParameters={evalParameters}
                            displayCorrection={displayCorrection}/>
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

async function loadQuestionDBAndEvalStructure() {
    const [dbResponse, evalStructureResponse] = await Promise.all([
        fetch(process.env.PUBLIC_URL +"/questions/db.json", {
        // This is needed for local access sadly
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        }),
        fetch(process.env.PUBLIC_URL + "/evaluations/catamaran.json", {
        // This is needed for local access sadly
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
    ])

    const db = await dbResponse.json();
    const evalStructure = await evalStructureResponse.json();

    return [db, evalStructure];
}






export {EvaluationPage}