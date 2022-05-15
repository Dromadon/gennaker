import { generateEval } from './EvaluationGenerator';

const Categories = ["Meteo", "Conduite"];

test('generateEvalShouldReturnACategory', () => {
    const evaluation = generateEval();
    expect(evaluation).toHaveProperty("Meteo");
});

test('generateEvalShouldReturnCommunsInCategory', () => {
    const evaluation = generateEval();
    expect(evaluation["Meteo"]).toHaveProperty("Communs");
});

/* test('generateEvalShouldReturnQuestionInDB', () => {
    const questions = generateEval()["Meteo"]["Communs"];
    expect(evaluation["Meteo"]["Communs"]).toHaveProperty("Communs");
}) */