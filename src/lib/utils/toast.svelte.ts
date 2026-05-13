const TOAST_DURATION_MS = 4000

export function createToast() {
	let message = $state('')
	let visible = $state(false)
	let timer: ReturnType<typeof setTimeout> | null = null

	function show(msg: string) {
		if (timer) clearTimeout(timer)
		message = msg
		visible = true
		timer = setTimeout(() => (visible = false), TOAST_DURATION_MS)
	}

	function hide() {
		visible = false
	}

	return {
		get message() { return message },
		get visible() { return visible },
		show,
		hide
	}
}
