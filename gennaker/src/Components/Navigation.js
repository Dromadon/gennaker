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
              <LinkContainer to="/howitworks">
                <Nav.Link href="#">Fonctionnement des évaluations</Nav.Link>
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

/*
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
        <a href="#" class="navbar-brand">Brand</a>
        <button type="button" class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarCollapse">
            <div class="navbar-nav">
                <a href="#" class="nav-item nav-link active">Home</a>
                <a href="#" class="nav-item nav-link">Profile</a>
                <a href="#" class="nav-item nav-link">Messages</a>
                <a href="#" class="nav-item nav-link disabled" tabindex="-1">Reports</a>
            </div>
            <div class="navbar-nav ms-auto">
                <a href="#" class="nav-item nav-link">Login</a>
            </div>
        </div>
    </div>
</nav>
*/