import React from 'react';
import { Container, Form, Row, Col, Button} from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";

function Settings(props) {

    const [support, setSupport] = useState("catamaran");
    const [length, setLength] = useState("standard");

    let navigate = useNavigate();

    const handleSubmit = (event) => {
            event.preventDefault();
            navigate("/evaluation");
        }

    const handleSupportChange = (event) => {
            setSupport(event.target.value);
        }
    const handleLengthChange = (event) => {
            setLength(event.target.value);
        }
    
    return (
        <Container fluid className="mt-5">
            <Row>
                <Col lg="6" className="mx-auto text-center">
                    <h1>Bienvenue sur <span className="fw-light fst-italic">Gennaker</span> ⛵</h1>
                    <h6 className="fw-light">Outil de génération d’évaluations pour le niveau 4 FFV</h6>
                </Col>
            </Row>
                <Form onSubmit={handleSubmit}>
                    <Row className="mt-5 justify-content-center">
                        <Col md={3} className="mb-5">
                            <h4>1. Je choisis mon support</h4>
                            <Form.Group onChange={handleSupportChange} controlId="support">
                                <Form.Check defaultChecked  name="support" type="radio" label="Catamaran" value="catamaran" />
                                <Form.Check name="support" type="radio" label="Dériveur" value="deriveur" />
                                <Form.Check disabled name="support" type="radio" label="Windsurf" value="windsurf" />
                                <Form.Check disabled name="support" type="radio" label="Croisière" value="croisiere" />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="mb-5">
                            <h4>2. Je choisis mes réglages</h4>
                            <h6>Longueur de l’évaluation <i className="bi bi-question-circle"></i></h6>
                            <Form.Group onChange={handleLengthChange} controlId="length">
                                <Form.Check defaultChecked name="length" type="radio" label="Évaluation standard" value="standard"/>
                                <Form.Check name="length" type="radio" label="Évaluation raccourcie" value="shortened"/>
                                <Form.Check disabled name="length" type="radio" label="Test de positionnement" value="quick"/>
                            </Form.Group>
                            <hr/>
                            <h6>Autres paramètres</h6>
                            <Form.Group>
                                <Form.Check disabled type="switch" label="Afficher les questions en ordre aléatoire" id="disabled-custom-switch"/>
                            </Form.Group>
                        </Col>          
                        <Col md={3} className="mb-5">
                            <Form.Group controlId="submit">
                                <h4>3. Je génère mon évaluation</h4>
                                <p>Je pourrai imprimer et afficher/masquer les corrections sur la page suivante</p>
                                <Button type="submit">Générer une évaluation</Button>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
        </Container>
    )
}



export default Settings;