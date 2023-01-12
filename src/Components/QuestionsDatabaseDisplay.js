import React, { useEffect, useState } from 'react';
import { Container, Col, Row, Nav, Navbar, Accordion } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';

import { QuestionDatabase } from '../Infrastructure/QuestionsDatabase/QuestionDatabase';
import { EvaluationStructureMaker } from '../Infrastructure/EvaluationStructure/EvaluationStructureMaker';

function QuestionsDatabaseDisplay(props) {

    const [support, setSupport] = useState("catamaran")
    const [length, setLength] = useState("standard")
    const [categoryName, setCategoryName] = useState("")
    const [sectionName, setSectionName] = useState("")

    const [evaluationStructure, setEvaluationStructure] = useState({})

    const handleSupportChange = (event) => {
        setSupport(event.target.value)
    }

    const handleCategoryNameChange = (event) => {
        setCategoryName(event.target.value)
    }

    const handleSectionNameChange = (event) => {
        setSectionName(event.target.value)
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
    }, [props, support])

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
                            <h4>Choisissez le support :</h4>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSupportChange} value={support}>
                                <option value="catamaran">Catamaran</option>
                                <option value="deriveur">Dériveur</option>
                                <option value="windsurf">Windsurf</option>
                                <option value="croisiere">Croisière</option>
                            </select>
                        </Col>
                        <Col md={3}>
                            <h4>Choisissez la catégorie :</h4>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleCategoryNameChange} value={categoryName}>
                                {Object.entries(evaluationStructure).length !== 0 &&
                                    Object.entries(evaluationStructure.categories).map(([categoryName, category]) => {
                                        return (<option value={categoryName}>{category.displayName}</option>)
                                    })
                                }
                            </select>
                        </Col>
                        <Col md={3}>
                            <h4>Choisissez la section :</h4>
                            <select className="form-select mb-3" aria-label=".form-select support" onChange={handleSectionNameChange} value={sectionName}>
                                {categoryName !== "" &&
                                    Object.entries(evaluationStructure.categories[categoryName].sections).map(([sectionName, section]) => (<option value={sectionName}>{section.displayName}</option>))
                                }
                            </select>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <h4 id="contenu">Structure d'une évaluation :</h4>


                    </Row>
                </Col>
            </Row>
        </Container>
    )
}



export { QuestionsDatabaseDisplay };