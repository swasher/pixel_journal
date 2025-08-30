import { writable } from 'svelte/store';

// Этот store будет хранить состояние чекбокса глобального поиска.
// true - поиск по всем категориям, false - только по текущей.
export const isGlobalSearch = writable(false);
