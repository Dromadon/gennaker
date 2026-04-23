import React, { useEffect, useState } from 'react';
import { Form, Container, Col, Row, Nav, Navbar, Accordion } from 'react-bootstrap';

import { QuestionDatabase } from '../Infrastructure/QuestionsDatabase/QuestionDatabase';
import { EvaluationStructureMaker } from '../Infrastructure/EvaluationStructure/EvaluationStructureMaker';

import { Question } from '../Components/Question'

function QuestionsDatabaseDisplay(props) {

    const [support, setSupport] = useState("catamaran")
    const [length] = useState("standard")
    const [categoryName, setCategoryName] = useState("")
    const [sectionName, setSectionName] = useState("")

    const [evaluationStructure, setEvaluationStructure] = useState({})
    const [questions, setQuestions] = useState([])

    const [displaySettings, setDisplaySettings] = useState({
        displayCorrection: false
    })

    const handleSupportChange = (event) => {
        setSupport(event.target.value)
    }

    const handleCategoryNameChange = (event) => {
        setCategoryName(event.target.value)
        setSectionName(Object.keys(evaluationStructure.categories[event.target.value].sections)[0])
    }

    const handleSectionNameChange = (event) => {
        setSectionName(event.target.value)
    }

    const toggleDisplayCorrection = (event) => {
        console.info("Switching correction display");
        setDisplaySettings({...displaySettings, displayCorrection: !displaySettings.displayCorrection});
    }

    useEffect(() => {
        const evaluationStructureMaker = new EvaluationStructureMaker();

        const getEvaluationStructure = async () => {
            //On génère une évaluation complète par défaut avec toutes les catégories
            console.debug("Creating new evaluation from evaluationStructureMaker");
            let evalStructure = await evaluationStructureMaker
                .generateStructure({ support: support, length: length }); 

            setEvaluationStructure(evalStructure)
            //On met la première catégorie comme sélectionnée
            setCategoryName(Object.keys(evalStructure.categories)[0])
            //On met la première section de cette catégorie comme sélectionnée
            setSectionName(Object.keys(Object.values(evalStructure.categories)[0].sections)[0])
        }
        getEvaluationStructure();
    }, [props, support])

    useEffect(() => {
        const getQuestions = async () => {
            console.debug("Fetching all questions")
            const questionsDB = new QuestionDatabase();
            setQuestions(await questionsDB.getQuestions({category: categoryName, section: sectionName, support: support}))
        }

        getQuestions()
    }, [props, support, categoryName, sectionName])

    return (
        <Container fluid>
                <Col xl={10} className="mx-auto mt-3">
                    <Row className="align-items-center">
                        <Col md={3}>
                            <h5>Choisissez le support :</h5>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSupportChange} value={support}>
                                <option value="catamaran">Catamaran</option>
                                <option value="deriveur">Dériveur</option>
                                <option value="windsurf">Windsurf</option>
                                <option value="croisiere" disabled>Croisière</option>
                            </select>
                        </Col>
                        <Col md={3}>
                            <h5>Choisissez la catégorie :</h5>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleCategoryNameChange} value={categoryName}>
                                {Object.entries(evaluationStructure).length !== 0 &&
                                    Object.entries(evaluationStructure.categories).map(([categoryName, category]) => {
                                        return (<option value={categoryName}>{category.displayName}</option>)
                                    })
                                }
                            </select>
                        </Col>
                        <Col md={3}>
                            <h5>Choisissez la section :</h5>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSectionNameChange} value={sectionName}>
                                {categoryName !== "" &&
                                    Object.entries(evaluationStructure.categories[categoryName].sections).map(([sectionName, section]) => (<option value={sectionName}>{section.displayName}</option>))
                                }
                            </select>
                        </Col>
                        <Col md={3}>
                            <Form>
                                <Form.Switch
                                onChange={toggleDisplayCorrection}
                                id="toggleCorrection"
                                label="Afficher la correction"
                                checked={displaySettings.displayCorrection}
                                className="btn-md"
                                />
                            </Form>
                        </Col>
                        <hr/>
                    </Row>
                    <Row className="">
                        <Col className=''>
                        <h5 id="contenu">Liste des questions</h5>
                        {
                           questions.map(question => (
                                <Question
                                    filePath={process.env.PUBLIC_URL + "/questions/" + question.fileName}
                                    answerSize={question.answerSize}
                                    displaySettings={displaySettings}
                                />
                           ))
                        }
                        </Col>
                    </Row>
                </Col>
        </Container>
    )
}



export { QuestionsDatabaseDisplay };