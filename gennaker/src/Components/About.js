import React from 'react';
import { Container, Col } from 'react-bootstrap';

class About extends React.Component {
    
    render() {
        return (
                <Container>
                    <Col xs={8} className="mx-auto mt-3">
                    <h2>Quel est l’objectif de Gennaker ?</h2>
                    <main>
                        <p>
                            <span class="fw-bold">Gennaker a été construit face au constat de non-structuration des évaluations théoriques du niveau 4 fédéral, qui ouvre l’accès à la formation moniteurs.</span> Si la réglementation fixe un contenu général des évaluations, le fonctionnement des divers formateurs était assez disparate, chacun créant ses évaluations de son côté, en s’inspirant parfois de documents transmis par des prédécesseurs…
                        </p><p>
                            <span class="fw-bold">Il en résultait une hétérogénéité forte des évaluations.</span> Outre l’inégalité qu’elle fait peser sur les candidats stagiaires face à l’examen, cette situation les empêche aussi de se préparer convenablement faute d’examens d’entraînements homogènes et représentatifs, et consomme du temps aux évaluateurs·ices pour préparer les évaluations et les corrigés, alors qu’ielles ont souvent d’autres obligations. 
                        </p><p>
                            <span class="fw-bold">Gennaker est né afin de remédier à cette situation, en proposant des évaluations de références homogènes et conformes en termes de contenu aux attendus du niveau 4 FFV. </span>Il permet la génération d’un grand nombre d’évaluations à partir d’une banque de question alimentées par de nombreux formateurs·ices et revues par des pairs, ainsi que d’un travail sur la structuration générale de ces évaluations.
                        </p><p class="fw-bold">
                            Avec Gennaker, les futurs stagiaires candidats disposent d’une base d’entraînement fiable pour préparer leur évaluation, tandis que les formateurs·ices peuvent générer en deux clics des évaluations pour leurs stages.
                        </p>
                    </main>
                    <h2>FAQ</h2>
                    <h2>Licence</h2>
                        <p>
                            Gennaker et toutes les questions de la base sont sous licence CC-BY-SA, sauf mention contraire explicitement ajoutée à chaque question concernée.
                        </p>
                        <p>
                            Dans l’ensemble, cette licence vous permet d’utiliser le contenu de Gennaker autant que vous le souhaitez, à condition de mentionner la source Gennaker et de ne pas utiliser ce contenu dans un cadre commercial. Vous pouvez donc utiliser Gennaker pour des évaluations lors de stage, mais vous ne pouvez pas vendre un service de génération d’évaluations ou un livre basé sur le contenu de Gennaker, même en le citant.
                        </p>
                        <p>
                            Pour citer la source Gennaker, mentionnez simplement « Généré avec gennaker.bzh », ou laissez la mention automatiquement ajoutée sur les évaluations générées.
                        </p>
                    <h2>Comment contribuer</h2>
                    <h2>Contributeurs</h2>
                    </Col>
                </Container>
        )
    }
}



export default About;