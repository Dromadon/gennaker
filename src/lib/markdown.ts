import { marked, Renderer } from 'marked'

export function createMarkdownRenderer(questionId: number, r2BaseUrl: string) {
	const renderer = new Renderer()
	renderer.image = ({ href, text, title }) => {
		let src = href
		if (href.startsWith('images/')) {
			const filename = href.split('/').pop() ?? href
			src = `${r2BaseUrl}/${questionId}/images/${filename}`
		}
		const titleAttr = title ? ` title="${esc(title)}"` : ''
		return `<img src="${src}" alt="${esc(text)}"${titleAttr}>`
	}
	return (md: string): string => marked.parse(md, { renderer }) as string
}

function esc(s: string) {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
