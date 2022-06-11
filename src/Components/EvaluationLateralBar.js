import {Navbar, Nav, Form, Button} from "react-bootstrap";
import { NavHashLink } from 'react-router-hash-link';

function EvaluationLateralBar (props) {
    return(
        <div className="lateralNavBar sticky-lg-top mb-3">
            <Navbar id="navbar-questions" color="light" className="flex-column align-items-start">
                <a class="navbar-brand" href="#">Catégories</a>
                <Nav class="nav nav-pills flex-column">
                    {Object.keys(props.evaluation).map((category) => { 
                        const categoryDisplayName = props.db[category]["meta"]["categoryDisplayName"]
                        return(<NavHashLink class="nav-link" to={"#category-"+category}>{categoryDisplayName}</NavHashLink>)})}
                </Nav>
            </Navbar>
            <hr/>
            <div className="vstack gap-3">
                <Form>
                    <Form.Switch
                    onChange={props.toggleCorrectionDisplay}
                    id="toggleCorrection"
                    label="Afficher la correction"
                    checked={props.displayCorrection}
                    className="btn-md"
                    />
                </Form>
                <Button onClick={props.handlePrint} size="md" variant="primary"><div className="hstack"><i class="bi bi-printer-fill"></i><span class="mx-auto">Imprimer</span></div></Button>
                <Button onClick={() => window.location.reload()} variant="success" size="md"><div className="hstack"><i class="bi bi-arrow-clockwise"></i><span class="mx-auto">Générer une nouvelle évaluation</span></div></Button>
            </div>
        </div>
    )
}

export {EvaluationLateralBar}