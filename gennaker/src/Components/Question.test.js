import { transformImageURI } from './Question';

test('transformURI should return URI', () => {
    const URI = 'images/test.png';
    const filePath = 'questions/meteo/question_test.md'
    const expectedURI = 'questions/meteo/images/test.png'

    const transformedURI = transformImageURI(URI, filePath);
    expect(transformedURI).toBe(expectedURI);
})