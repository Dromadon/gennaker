// Worker minimal pour les tests d'intégration Miniflare.
// Ce fichier n'est pas utilisé en production.
export default {
	async fetch(): Promise<Response> {
		return new Response('ok')
	}
}
