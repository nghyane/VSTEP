import { browser } from '$app/environment';

type User = { id: string; email: string; full_name: string; role: string };

function createAuth() {
	let token = $state(browser ? localStorage.getItem('token') : null);
	let user = $state<User | null>(null);

	return {
		get token() { return token; },
		get user() { return user; },
		get ok() { return !!token && !!user; },
		login(t: string, u: User) {
			token = t;
			user = u;
			if (browser) localStorage.setItem('token', t);
		},
		logout() {
			token = null;
			user = null;
			if (browser) localStorage.removeItem('token');
		}
	};
}

export const auth = createAuth();
