import { describe, it, expect } from 'vitest'
import { createMarkdownRenderer, createLocalMarkdownRenderer } from './markdown'

describe('createMarkdownRenderer', () => {
	const render = createMarkdownRenderer(42, 'https://r2.example.com')

	it('résout images/schema.png → URL R2 complète', () => {
		expect(render('![alt](images/schema.png)')).toContain(
			'https://r2.example.com/42/images/schema.png'
		)
	})

	it('laisse les URL absolues intactes', () => {
		expect(render('![alt](https://other.com/img.png)')).toContain('https://other.com/img.png')
	})

	it('laisse les chemins absolus (/questions-images/...) intacts', () => {
		const src = '/questions-images/meteo/carte/images/carte.png'
		expect(render(`![alt](${src})`)).toContain(src)
	})

	it('rend le texte alt', () => {
		expect(render('![mon alt](images/x.png)')).toContain('alt="mon alt"')
	})

	it('rend le markdown non-image normalement', () => {
		expect(render('**gras**')).toContain('<strong>gras</strong>')
	})
})

describe('createLocalMarkdownRenderer', () => {
	const objectUrl = 'blob:http://localhost/fake-uuid'
	const pending = new Map([['local.png', { file: new File([], 'local.png'), objectUrl }]])

	it('utilise l\'objectURL pour une image en attente', () => {
		const render = createLocalMarkdownRenderer(pending, 42, 'https://r2.example.com')
		expect(render('![image](images/local.png)')).toContain(objectUrl)
	})

	it('résout vers R2 pour une image existante (non en attente)', () => {
		const render = createLocalMarkdownRenderer(pending, 42, 'https://r2.example.com')
		expect(render('![image](images/existing.png)')).toContain(
			'https://r2.example.com/42/images/existing.png'
		)
	})

	it('l\'objectURL prend la priorité sur R2 quand même nom', () => {
		const conflict = new Map([['schema.png', { file: new File([], 'schema.png'), objectUrl }]])
		const render = createLocalMarkdownRenderer(conflict, 42, 'https://r2.example.com')
		const result = render('![image](images/schema.png)')
		expect(result).toContain(objectUrl)
		expect(result).not.toContain('r2.example.com')
	})

	it('laisse les URL absolues intactes', () => {
		const render = createLocalMarkdownRenderer(pending, 42, 'https://r2.example.com')
		expect(render('![image](https://other.com/img.png)')).toContain('https://other.com/img.png')
	})

	it('fonctionne sans images en attente (map vide)', () => {
		const render = createLocalMarkdownRenderer(new Map(), 42, 'https://r2.example.com')
		expect(render('![image](images/x.png)')).toContain('https://r2.example.com/42/images/x.png')
	})

	it('rend le markdown non-image normalement', () => {
		const render = createLocalMarkdownRenderer(pending, 42, 'https://r2.example.com')
		expect(render('**gras**')).toContain('<strong>gras</strong>')
	})
})
