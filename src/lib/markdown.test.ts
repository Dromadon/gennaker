import { describe, it, expect } from 'vitest'
import { createMarkdownRenderer } from './markdown'

describe('createMarkdownRenderer', () => {
	const render = createMarkdownRenderer(42, 'securite', 'feux', 'https://r2.example.com')

	it('résout images/schema.png → URL R2 complète', () => {
		expect(render('![alt](images/schema.png)')).toContain(
			'https://r2.example.com/securite/feux/42/images/schema.png'
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
