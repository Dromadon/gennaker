import {Navbar, Nav, Form, Button} from "react-bootstrap";
import { NavHashLink } from 'react-router-hash-link';

function EvaluationLateralBar (props) {
    return(
        <div className="lateralNavBar sticky-lg-top my-3">
            <Navbar id="navbar-categories" color="light" className="flex-column align-items-start">
                <Nav class="nav nav-pills flex-column">
                    {props.evaluation.getCategories().map((categoryName, category) => { 
                        return(<NavHashLink class="nav-link" to={"#category-"+categoryName}>
                                {category.DisplayName}
                            </NavHashLink>)})}
                </Nav>
            </Navbar>
            <hr/>
            <div className="vstack gap-3">
                <Form>
                    <Form.Switch
                    onChange={props.toggleDisplayCorrection}
                    id="toggleCorrection"
                    label="Afficher la correction"
                    checked={props.displayCorrection}
                    className="btn-md"
                    />
                    <Form.Switch
                    onChange={props.toggleDisplayCategoryTitles}
                    id="toggleCategoryTitles"
                    label="Afficher les titres de catégories"
                    checked={props.displayCategoryTitles}
                    className="btn-md"
                    />
                    <hr/>
                </Form>
                <Button onClick={props.handlePrint} size="md" variant="primary"><div className="hstack"><i class="bi bi-printer-fill"></i><span class="mx-auto">Imprimer</span></div></Button>
                <Button onClick={() => window.location.reload()} variant="success" size="md"><div className="hstack"><i class="bi bi-arrow-clockwise"></i><span class="mx-auto">Générer une nouvelle évaluation</span></div></Button>
            </div>
        </div>
    )
}

export {EvaluationLateralBar}