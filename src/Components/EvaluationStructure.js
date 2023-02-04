import React, { useEffect, useState } from 'react';
import { Container, Col, Row, Nav, Navbar, Accordion } from 'react-bootstrap';
import { NavHashLink } from 'react-router-hash-link';

import { EvaluationStructureMaker } from '../Infrastructure/EvaluationStructure/EvaluationStructureMaker';

function EvaluationStructure(props) {

    const [support, setSupport] = useState("catamaran")
    const [length, setLength] = useState("standard")
    const [category, setCategory] = useState("")
    const [section, setSection] = useState("")

    const [evaluationStructure, setEvaluationStructure] = useState({})

    const handleSupportChange = (event) => {
        setSupport(event.target.value)
    }

    const handleLengthChange = (event) => {
        setLength(event.target.value)
    }

    useEffect(() => {
        const evaluationStructureMaker = new EvaluationStructureMaker();

        const getEvaluationStructure = async () => {
            console.debug("Creating new evaluation from evaluationStructureMaker");
            let evalStructure = await evaluationStructureMaker
                .generateStructure({ support: support, length: length });

            setEvaluationStructure(evalStructure)
        }
        getEvaluationStructure();
    }, [props, support, length])

    return (
        <Container fluid>
            <Row>
                <Col xl={10} className="mt-3 mx-auto">
                    <Row className="mb-3">
                        <Col md={3}>
                            <h5>Choisissez le support :</h5>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSupportChange} value={support}>
                                <option value="catamaran">Catamaran</option>
                                <option value="deriveur">Dériveur</option>
                                <option value="windsurf" disabled>Windsurf</option>
                                <option value="croisiere" disabled>Croisière</option>
                            </select>
                        </Col>
                        <Col md={3}>
                            <h5>Choisissez la longueur :</h5>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleLengthChange} value={length}>
                                <option value="standard">Standard</option>
                                <option value="raccourcie">Raccourcie</option>
                                <option value="positionnement">Test de positionnement</option>
                            </select>
                        </Col>
                        <hr/>
                    </Row>
                    <Row className="">
                        <Col>
                            <h4 id="contenu">Structure d'une évaluation :</h4>
                            {Object.keys(evaluationStructure).length != 0 &&
                                Object.entries(evaluationStructure.categories).map(([categoryName, category]) => {
                                    return (
                                        <>
                                        <h5>{category.displayName}</h5>
                                        <ul>
                                            {Object.entries(category.sections).map(([sectionName, section]) => {
                                                return (<li>{section.displayName} : {section.questionsNumber} question{section.questionsNumber > 1 && "s"}</li>)
                                            })}
                                        </ul>
                                        </>
                                    )
                                })
                            }
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    )
}



export { EvaluationStructure };