import React, { useRef, useState, useEffect } from 'react';
import { EvaluationLateralBar } from "./EvaluationLateralBar";
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"

import { useSearchParams } from 'react-router-dom';

import {useReactToPrint} from 'react-to-print';
import { Evaluation } from './Evaluation';

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
                            displayCategoryTitles={displayCategoryTitles}
                            toggleDisplayCorrection={toggleDisplayCorrection}
                            toggleDisplayCategoryTitles={toggleDisplayCategoryTitles}
                            handlePrint={handlePrint}/>
                    </Col>
                    <Col sm={12} lg={10}>
                        <Evaluation id="evaluation" 
                            ref={componentRef}
                            db={db} 
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
    const evalStructureResponse = await fetch(process.env.PUBLIC_URL + "/evaluations/"+support+"_"+length+".json", {
            headers : { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                }
        })
    const evalStructure = await evalStructureResponse.json();

    const categoriesDB = await Promise.all(Object.keys(evalStructure).map(
        //We put every category DB in an object with a single key
        //being the category name
        /* Each object is like:
            {
                meteo: {
                    DB content fetched from db.json
                }
            }
        //*/
         async (category) => ({[category]: await (await fetch(process.env.PUBLIC_URL +"/questions/"+category+"/db.json", {
                headers : { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
            })).json()}))
    );
    
    //Then we merge all these category db objects in order to get
    //a single object with each top key being a category
    /*
            {
                meteo: {…},
                conduite: {…},
                navigation: {…},
                …
            }
    //*/
    const db = categoriesDB.reduce((item1, item2) => ({...item1, ...item2}));

    return [db, evalStructure];
}






export {EvaluationPage}