const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function api<T>(
	path: string,
	options: RequestInit = {},
	token?: string
): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers
		}
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error(err.message ?? 'Request failed');
	}

	return res.json();
}
