import React from 'react';
import { Container, Form, Row, Col, ButtonGroup} from 'react-bootstrap';

class Settings extends React.Component {
    
    render() {
        return (
            <Container fluid className="mt-5">
                <Row>
                    <Col lg="6" className="mx-auto text-center">
                        <h1>Bienvenue sur <span className="fw-light fst-italic">Gennaker</span> ⛵</h1>
                        <h6 className="fw-light">Outil de génération d’évaluations pour le niveau 4 FFV</h6>
                    </Col>
                </Row>
                    <Form>
                        <Row className="mt-5 justify-content-center">
                            <Form.Group as={Col} md={3} className="mb-5" controlId="formGridEmail">
                                <h4>1. Je choisis mon support</h4>
                                <Form.Check name="support" type="radio" label="Catamaran" id="catamaran"/>
                                <Form.Check name="support" type="radio" label="Dériveur" id="deriveur"/>
                                <Form.Check name="support" type="radio" label="Windsurf" id="windsurf"/>
                                <Form.Check disabled type="radio" label="Croisière" id="croisiere"/>
                            </Form.Group>
                            <Form.Group as={Col} md={3} className="mb-5" controlId="formGridEmail">
                                <h4>2. Je choisis mes réglages</h4>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1"/>
                                    <label class="form-check-label" for="flexRadioDefault1">
                                        Évaluation standard <i class="bi bi-question-circle"></i>
                                    </label>
                                    </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" checked/>
                                    <label class="form-check-label" for="flexRadioDefault2">
                                        Évaluation raccourcie
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" checked/>
                                    <label class="form-check-label" for="flexRadioDefault2">
                                        Test de positionnement
                                    </label>
                                </div>
                            </Form.Group>
                            <Form.Group as={Col} md={2} className="mb-5" controlId="formGridEmail">
                                <h4>3. C’est parti !</h4>
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" placeholder="Enter email" />
                            </Form.Group>
                        </Row>
                    </Form>
            </Container>
        )
    }
}



export default Settings;