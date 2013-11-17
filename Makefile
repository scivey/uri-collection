SERVEDIR=.
SCSS =./helpers/scss
CSS=$(SERVEDIR)/CSS
PAGENAMES=api.html index.html spec.html
HELP=./helpers
COFFEES=handledox handlemarkdown handlespec
COFFINDIR=$(foreach coffee, $(COFFEES), $(addprefix $(HELP)/, $(coffee)))


PAGES=$(foreach page, $(PAGENAMES), $(addprefix $(SERVEDIR)/, $(page)))

TEMPLATES=$(wildcard ./helpers/tmpl/*.handlebars)

main: css docoff

css: $(CSS)/styles.css

$(CSS)/styles.css: $(SCSS)/styles.scss
	sass $(SCSS)/styles.scss > $(CSS)/styles.css

docoff:
	coffee $(HELP)/handledox.coffee
	coffee $(HELP)/handlemarkdown.coffee
	coffee $(HELP)/handlespec.coffee
