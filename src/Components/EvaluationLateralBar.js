import {Navbar, Nav, Form, Button} from "react-bootstrap";
import { NavHashLink } from 'react-router-hash-link';

function EvaluationLateralBar (props) {
    return(
        <div className="lateralNavBar sticky-lg-top my-3">
            <Navbar id="navbar-categories" color="light" className="flex-column align-items-start">
                <Nav class="nav nav-pills flex-column">
                    {props.evaluation.getCategories().map(([categoryName, category]) => { 
                        console.log(category)
                        return(<NavHashLink class="nav-link" to={"#category-"+categoryName}>
                                {category.displayName}
                            </NavHashLink>)})}
                </Nav>
            </Navbar>
            <hr/>
            <div className="vstack gap-2">
                <Form>
                    <Form.Switch
                    onChange={props.toggleDisplayCorrection}
                    id="toggleCorrection"
                    label="Afficher la correction"
                    checked={props.displaySettings.displayCorrection}
                    className="btn-md"
                    />                    
                </Form>
            </div>
            <hr/>
            <div className="vstack gap-2">
            <Form>
                <Form.Switch
                    onChange={props.toggleDisplayAnswerSpace}
                    id="toggleAnswerSpace"
                    label="Laisser un espace de réponse sous les questions"
                    checked={props.displaySettings.displayAnswerSpace}
                    className="btn-md"
                />
                <Form.Switch
                    onChange={props.toggleDisplayCategoryTitles}
                    id="toggleCategoryTitles"
                    label="Afficher les titres de catégories"
                    checked={props.displaySettings.displayCategoryTitles}
                    className="btn-md"
                />
            </Form>
                <Button onClick={props.handlePrint} size="md" variant="primary"><div className="hstack"><i class="bi bi-printer-fill"></i><span class="mx-auto">Imprimer</span></div></Button>
            </div>    
            <hr/>
            <div className="vstack gap-2">
                <Button onClick={props.changeAllQuestions} variant="success" size="md"><div className="hstack"><i class="bi bi-arrow-clockwise"></i><span class="mx-auto">Générer une nouvelle évaluation</span></div></Button>
            </div>
        </div>
    )
}

export {EvaluationLateralBar}