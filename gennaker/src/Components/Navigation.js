import React from "react"
import {Container, Nav, Navbar} from "react-bootstrap"


function Navigation (props) {
    return(
        <Navbar collapseOnSelect expand="lg" bg="primary" variant="dark">
          <Container>
          <Navbar.Brand href="#home">Gennaker</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#">Générer une évaluation</Nav.Link>
              <Nav.Link href="#">Fonctionnement des évaluations</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link href="#">À propos</Nav.Link>
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