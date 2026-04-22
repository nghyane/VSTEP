import { browser } from '$app/environment';

function createAuth() {
	let token = $state<string | null>(browser ? localStorage.getItem('admin_token') : null);
	let user = $state<{ id: string; email: string; full_name: string; role: string } | null>(null);

	return {
		get token() {
			return token;
		},
		get user() {
			return user;
		},
		get isAuthenticated() {
			return !!token;
		},
		set(newToken: string, newUser: typeof user) {
			token = newToken;
			user = newUser;
			if (browser) localStorage.setItem('admin_token', newToken);
		},
		clear() {
			token = null;
			user = null;
			if (browser) localStorage.removeItem('admin_token');
		}
	};
}

export const auth = createAuth();
