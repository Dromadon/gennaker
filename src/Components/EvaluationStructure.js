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
                <Col xs={12} lg={2} className="lateralColumn">
                    <div className="lateralNavBar sticky-lg-top vstack">
                        <Navbar id="navbar-questions" color="light" className="flex-column align-items-start">
                            <Nav className="nav nav-pills flex-column mt-3">
                                <NavHashLink to="#contenu">Structure d'une évaluation</NavHashLink>
                            </Nav>
                        </Navbar>
                    </div>
                </Col>
                <Col xs={12} lg={10} className="mt-3">
                    <Row className="mb-3">

                        <Col md={3}>
                            <h4>Choisissez le support :</h4>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSupportChange} value={support}>
                                <option value="catamaran">Catamaran</option>
                                <option value="deriveur">Dériveur</option>
                                <option value="windsurf">Windsurf</option>
                                <option value="croisiere">Croisière</option>
                            </select>
                        </Col>
                        <Col md={3}>
                            <h4>Choisissez la longueur :</h4>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleLengthChange} value={length}>
                                <option value="standard">Standard</option>
                                <option value="raccourcie">Raccourcie</option>
                                <option value="positionnement">Test de positionnement</option>
                            </select>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <h4 id="contenu">Structure d'une évaluation :</h4>

                        {Object.keys(evaluationStructure).length != 0 &&
                            Object.entries(evaluationStructure.categories).map(([categoryName, category]) => {
                                return (
                                    <p><h5>{category.displayName}</h5>
                                        {Object.entries(category.sections).map(([sectionName, section]) => {
                                            return (<li>{section.displayName} : {section.questionsNumber} question{section.questionsNumber > 1 && "s"}</li>)
                                        })}
                                    </p>
                                )
                            })
                        }

                    </Row>
                </Col>
            </Row>
        </Container>
    )
}



export { EvaluationStructure };