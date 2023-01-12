import React from "react"
import {Container, Nav, Navbar} from "react-bootstrap"
import {LinkContainer} from 'react-router-bootstrap'

function Navigation (props) {
    return(
        <Navbar id="topNavBar" collapseOnSelect expand="lg" variant="dark">
          <Container fluid>
          <Navbar.Brand href="#home">Gennaker</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <LinkContainer to="/settings">
                <Nav.Link href="#">Générer une évaluation</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/evaluationstructure">
                <Nav.Link href="#">Structure des évaluations</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/questionsdatabasedisplay">
                <Nav.Link href="#">Banque de questions</Nav.Link>
              </LinkContainer>
            </Nav>
            <Nav>
              <LinkContainer to="/about">
                <Nav.Link href="#">À propos</Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
          </Container>
        </Navbar>
    );
}

export { Navigation }