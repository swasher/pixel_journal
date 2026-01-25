server:
	npm run dev --

tunnel:
	# first run `ngrok config add-authtoken <ngrok token>`  - token on page 'your-autotoken', not 'tunnels->autotoken'!!!
	ngrok http 8000

netlify_push:
	git push origin master