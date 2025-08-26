import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// Эта опция позволяет Vite принимать подключения с других устройств в сети, что необходимо для ngrok
		host: true,
		allowedHosts: [
			// Разрешаем все поддомены бесплатного тарифа ngrok
			'.ngrok-free.app'
		]
	}
});
