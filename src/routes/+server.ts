import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Эта функция будет перехватывать все GET запросы к корневому URL (`/`)
export const GET: RequestHandler = async () => {
	// и немедленно перенаправлять их на страницу /backlog
	throw redirect(307, '/backlog');
};
