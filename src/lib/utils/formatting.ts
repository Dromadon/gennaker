const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric'
}

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
}

export function formatDate(ts: number): string {
	return new Date(ts * 1000).toLocaleDateString('fr-FR', DATE_OPTIONS)
}

export function formatDateTime(ts: number): string {
	return new Date(ts * 1000).toLocaleString('fr-FR', DATETIME_OPTIONS)
}
