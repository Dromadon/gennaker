import React, { Component } from 'react';
import { Evaluation } from './Evaluation';
import { generateEval } from '../Logic/EvaluationGenerator'

import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import { Navbar, Nav, Form, Button, Stack } from 'react-bootstrap';
import { NavHashLink } from 'react-router-hash-link';

import ReactToPrint from 'react-to-print';

class EvaluationPage extends Component {

    constructor(props) {
        super(props);        
        this.state = {
            "isDataLoaded": false,
            "isQuestionsReady": false,
            "error": false,
            "db": {},
            "evalStructure": {},
            "evalParameters": {
                "support": "catamaran"
            },
            "evaluation": {},
            "displayCorrection": false
        }
        this.printRef = React.createRef();
    }

    componentDidMount() {
        this.loadQuestionDBAndEvalStructure().then(([db, evalStructure]) => {
            console.debug("DB and structure fetched");
            this.setState({
                "isDataLoaded": true,
                "db": db,
                "evalStructure": evalStructure
            });
            this.setState({
                "evaluation": generateEval(db, evalStructure, this.state.evalParameters),
                "isQuestionsReady": true
            })
        })
    }

    render() {
        const { error, isDataLoaded, isQuestionsReady, evaluation, evalParameters, db, displayCorrection } = this.state;
        const support = evalParameters["support"]
        if (error) {
            return(<div>Error happened while loading content</div>);
        } else if (isQuestionsReady){
            return(
                <Container id="evaluationPage">
                    <Row>
                        <Col xs={12} lg={2}>
                            {this.renderNavBar(db, evaluation)}
                        </Col>
                        <Col className="px-0" sm={12} lg={10}>
                            <Evaluation id="evaluation" 
                                ref={el => (this.componentRef = el)} 
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
    };

    renderNavBar(db, evaluation) {
        return(
            <div className="lateralNavBar mt-3 p-3 sticky-lg-top rounded">
            <Navbar id="navbar-questions" color="light" className="flex-column align-items-strech p-3 mt-3">
                <a class="navbar-brand" href="#">Catégories</a>
                <Nav class="nav nav-pills flex-column">
                    {Object.keys(evaluation).map((category) => { 
                        const categoryDisplayName = db[category]["meta"]["categoryDisplayName"]
                        return(<NavHashLink class="nav-link" to={"#category-"+category}>{categoryDisplayName}</NavHashLink>)})}
                </Nav>
            </Navbar>
            <Form>
                {/*Need to find why is button on the left ?!*/}
                <Form.Switch
                   onChange={this.toggleCorrectionDisplay}
                   id="toggleCorrection"
                   label="Afficher la correction"
                   checked={this.state.displayCorrection}
                   className="btn-md"
                />
            </Form>
            <ReactToPrint
                trigger={() => {
                    return <Button size="md">Imprimer </Button>
                }}
                content={() => this.componentRef}
                bg="primary"
            />
            </div>
        )
    }

    toggleCorrectionDisplay = (event) => {
        this.setState({"displayCorrection": !this.state.displayCorrection});
    }

    async loadQuestionDBAndEvalStructure() {
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
}

export {EvaluationPage}