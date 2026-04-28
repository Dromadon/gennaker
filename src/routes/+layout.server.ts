import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ platform }) => ({
	r2BaseUrl: platform?.env.R2_PUBLIC_URL || '/r2-proxy'
})
