default:

clean:
	rm -rf dist
	rm -f index.js

build:
	make clean
	touch index.js
	npx gulp

