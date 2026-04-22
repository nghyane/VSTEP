import { browser } from '$app/environment';

type User = { id: string; email: string; full_name: string; role: string };

function createAuth() {
	let token = $state<string | null>(browser ? localStorage.getItem('admin_token') : null);
	let user = $state<User | null>(null);

	return {
		get token() { return token; },
		get user() { return user; },
		get isAuthenticated() { return !!token; },
		get isAdmin() { return user?.role === 'admin' || user?.role === 'staff'; },
		set(newToken: string, newUser: User) {
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
