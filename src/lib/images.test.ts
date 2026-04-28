import { describe, it, expect } from 'vitest'
import { sanitizeFilename } from './images'

describe('sanitizeFilename', () => {
	it('laisse un nom valide inchangé', () => {
		expect(sanitizeFilename('schema.png')).toBe('schema.png')
	})

	it('remplace les espaces par _', () => {
		expect(sanitizeFilename('mon image.png')).toBe('mon_image.png')
	})

	it('remplace les caractères spéciaux par _', () => {
		expect(sanitizeFilename('mon image!.png')).toBe('mon_image_.png')
	})

	it('conserve tirets, underscores et points', () => {
		expect(sanitizeFilename('mon-image_v2.png')).toBe('mon-image_v2.png')
	})

	it('conserve l\'extension', () => {
		expect(sanitizeFilename('photo.jpeg')).toBe('photo.jpeg')
	})

	it('remplace les caractères Unicode par _', () => {
		expect(sanitizeFilename('image_🎯.png')).toBe('image___.png')
	})

	it('remplace les slashes par _', () => {
		expect(sanitizeFilename('path/to/image.png')).toBe('path_to_image.png')
	})
})
