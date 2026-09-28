.PHONY: check test

check:
	bash -n currency-exchange.1h.sh
	bash -n install.sh
	bash -n scripts/package-release.sh
	python3 -m unittest discover -s tests -v

test: check
