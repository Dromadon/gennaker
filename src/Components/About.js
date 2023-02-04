import React from 'react';
import { Container, Col, Row, Nav, Navbar, Accordion } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { NavHashLink } from 'react-router-hash-link';

class About extends React.Component {

    render() {
        return (
            <Container fluid>
                <Row>
                    <Col xs={12} lg={2} className="lateralColumn">
                        <div className="lateralNavBar sticky-lg-top vstack">
                            <Navbar id="navbar-questions" color="light" className="flex-column align-items-start">
                                <Nav class="nav nav-pills flex-column mt-3">
                                    <NavHashLink to="#objectifs">Objectifs</NavHashLink>
                                    <NavHashLink to="#faq">FAQ</NavHashLink>
                                    <NavHashLink to="#licence">Licence</NavHashLink>
                                    <NavHashLink to="#contribution">Contribution</NavHashLink>
                                </Nav>
                            </Navbar>
                        </div>
                    </Col>
                    <Col xs={12} lg={10} className="mt-3">
                        <Container>
                            <Row className="mb-3">
                                <h2 id="objectifs">Quel est l’objectif de Gennaker ?</h2>
                                <p>
                                    <span class="fw-bold">Gennaker a été construit face au constat de non-structuration des évaluations théoriques du niveau 4 fédéral, qui ouvre l’accès à la formation moniteurs.</span> Si la réglementation fixe un contenu général des évaluations, le fonctionnement des divers formateurs était assez disparate, chacun créant ses évaluations de son côté, en s’inspirant parfois de documents transmis par des prédécesseurs…
                                    </p><p>
                                    <span class="fw-bold">Il en résultait une hétérogénéité forte des évaluations.</span> Outre l’inégalité qu’elle fait peser sur les candidats stagiaires face à l’examen, cette situation les empêche aussi de se préparer convenablement faute d’examens d’entraînements homogènes et représentatifs, et consomme du temps aux évaluateurs·ices pour préparer les évaluations et les corrigés, alors qu’ielles ont souvent d’autres obligations.
                                    </p><p>
                                    <span class="fw-bold">Gennaker est né afin de remédier à cette situation, en proposant des évaluations de références homogènes et conformes en termes de contenu aux attendus du niveau 4 FFV. </span>Il permet la génération d’un grand nombre d’évaluations à partir d’une banque de question alimentées par de nombreux formateurs·ices et revues par des pairs, ainsi que d’un travail sur la structuration générale de ces évaluations.
                                    </p><p class="fw-bold">
                                    Avec Gennaker, les futurs stagiaires candidats disposent d’une base d’entraînement fiable pour préparer leur évaluation, tandis que les formateurs·ices peuvent générer en deux clics des évaluations pour leurs stages.
                                    </p>
                            </Row>
                            <Row className="mb-3">
                                <h2 id="faq">FAQ</h2>
                                <Accordion>
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>Quel est le statut de Gennaker</Accordion.Header>
                                        <Accordion.Body>
                                            <p>Gennaker est un projet open-source, d’initiative personnelle. Son design, et notamment l’algorithme de génération des évaluations est le fruit d’un travail commun de plusieurs formateurs régionaux et nationaux.</p>
                                            <p>Nous faisons tout pour que Gennaker soit un outil du meilleur niveau de qualité possible, mais il reste un projet indépendant non-audité par la FFV</p>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="1">
                                        <Accordion.Header>Pourquoi ne pas proposer d’évaluations QCM ?</Accordion.Header>
                                        <Accordion.Body>
                                            Gennaker ne propose pas d’évaluations QCM car ces évaluations nous paraissent moins pertinentes que des évaluations à questions ouvertes au regard des enjeux de formation et certification :
                                        <ul>
                                                <li>Les QCM ne donnent pas d’information sur les raisonnements tenus par les candidats, sur les concepts maîtrisés et ceux restant à parfaire</li>
                                                <li>Les évaluations ouvertes poussent les candidats à maîtriser les concepts en profondeur</li>
                                                <li>Les évaluations ouvertes permettent moins de fraude et rendent le bachotage inefficient</li>
                                            </ul>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="2">
                                        <Accordion.Header>Combien de temps sont censées durer les évaluations créées par Gennaker ?</Accordion.Header>
                                        <Accordion.Body>
                                            <p>Le temps accordé pour l’évaluation est laissé entièrement à la main du formateur·ice. Celui-ci dépend certes de l’évaluation, mais aussi des connaissances des stagiaires, de leur état de fatigue… </p>
                                            <p>À titre indicatif, les évaluations générées par Gennaker peuvent être raisonnablement complétées par un stagiaire de bon niveau théorique en :
                                            <ul>
                                                    <li>1h30 pour une évaluation complète</li>
                                                    <li>1h pour une évaluation raccourcie</li>
                                                    <li>30 minutes pour un test de positionnement</li>
                                                </ul>
                                            </p>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="3">
                                        <Accordion.Header>Comment télécharger une évaluation en pdf ?</Accordion.Header>
                                        <Accordion.Body>
                                            Le plus simple pour le moment est de cliquer sur <span class="fst-italic">Imprimer</span> puis de sélectionner <span class="fst-italic">Imprimer en pdf</span>, qui est une fonctionnalité disponible sur tous les systèmes modernes.
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="4">
                                        <Accordion.Header>J’ai détecté une erreur dans une question/correction, que faire ?</Accordion.Header>
                                        <Accordion.Body>
                                            Contactez-nous
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </Row>
                            <Row className="mb-3">
                                <h2 id="licence">Licence</h2>
                                <p>
                                    Gennaker et toutes les questions de la base sont sous <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">licence CC-BY-NC-SA 4.0</a>, sauf mention contraire explicitement ajoutée à chaque question concernée.
                                </p>
                                <p>
                                    Dans l’ensemble, cette licence vous permet d’utiliser le contenu de Gennaker autant que vous le souhaitez, à condition de mentionner la source Gennaker et de ne pas utiliser ce contenu dans un cadre commercial. Vous pouvez donc utiliser Gennaker pour des évaluations lors de stage, mais vous ne pouvez pas vendre un service de génération d’évaluations ou un livre basé sur le contenu de Gennaker, même en le citant.
                                </p>
                                <p>
                                    Pour citer la source Gennaker, mentionnez simplement « Généré avec gennaker.bzh », ou laissez la mention automatiquement ajoutée sur les évaluations générées.
                                </p>
                            </Row>
                            <Row className="mb-3">
                                <h2 id="contribution">Comment contribuer</h2>
                                <h3>Contributeurs</h3>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Container>
        )
    }
}



export default About;