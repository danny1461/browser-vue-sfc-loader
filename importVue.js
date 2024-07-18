const CSS_OPS = ' >+~'.split('').reduce((acc, cur) => (acc[cur] = true, acc), {});

function splitMultipleSelectors(selector) {
	let result = [],
		quote = false,
		lastNdx = 0,
		len = selector.length;

	for (let i = 0; i < len; i++) {
		if (quote) {
			if (selector[i] == quote) {
				quote = false;
			}
		}
		else if (selector[i] == '"' || selector[i] == "'") {
			quote = selector[i];
		}
		else if (selector[i] == ',') {
			result.push(selector.substr(lastNdx, i - lastNdx));
			lastNdx = i + 1;
		}
	}

	if (lastNdx < len) {
		result.push(selector.substr(lastNdx, len - lastNdx));
	}

	return result;
}

function selectorInsert(selector, scopeIdAttr) {
	let quote = false,
		parenDepth = 0,
		colonPos = false;

	for (let i = selector.length - 1; i >= 0; i--) {
		if (quote) {
			if (selector[i] == quote) {
				if (!i || selector[i] != '\\') {
					quote = false;
				}
			}
		}
		else if (parenDepth > 0) {
			if (selector[i] == ')') {
				parenDepth++;
			}
			else if (selector[i] == '(') {
				parenDepth--;
			}
			else if (selector[i] == '"' || selector[i] == "'") {
				quote = selector[i];
			}
		}
		else if (selector[i] == '"' || selector[i] == "'") {
			quote = selector[i];
		}
		else if (selector[i] == ')') {
			parenDepth++;
		}
		else if (selector[i] == ':') {
			colonPos = i;
		}
		else if (CSS_OPS[selector[i]]) {
			break;
		}
	}

	if (colonPos !== false) {
		return selector.substr(0, colonPos) + scopeIdAttr + selector.substr(colonPos);
	}
	
	return selector + scopeIdAttr;
}

function processCssRules(cssRules, scopeIdAttr) {
	let result = '';
	for (let i = 0; i < cssRules.length; i++) {
		if (cssRules[i] instanceof CSSMediaRule) {
			processCssRules(cssRules[i].cssRules, scopeIdAttr);
		}
		else if (cssRules[i] instanceof CSSStyleRule) {
			let selectors = splitMultipleSelectors(cssRules[i].selectorText).map(selector => {
				if (selector.includes(scopeIdAttr)) {
					return selector;
				}

				return selectorInsert(selector, scopeIdAttr);
			});
			cssRules[i].selectorText = selectors.join(',');
		}

		result += cssRules[i].cssText;
	}

	return result;
}

export default function importVue(baseUrl, url) {
	if (!url) {
		url = baseUrl;
		baseUrl = location.href;
	}
	
	url = (new URL(url, baseUrl)).href;
	if (importVue.resolved[url]) {
		return Promise.resolve(importVue.resolved[url]);
	}

	let resolverId = crypto.randomUUID();
	return fetch(url)
		.then(r => r.text())
		.then(txt => {
			return new Promise((resolve) => {
				let match = txt.match(/^(.*)<template>(.*)<\/template>(.*)$/s),
					template = null;
				if (match) {
					template = match[2].trim();
					txt = match[1] + match[3];
				}

				let doc = document.implementation.createHTMLDocument('');
				doc.write(`<html><body>${txt}</body></html>`);

				let scopeIdAttr = null;
				let styles = Array.from(doc.querySelectorAll('style')).map(style => {
					if (style.hasAttribute('scoped')) {
						if (!scopeIdAttr) {
							scopeIdAttr = `[data-v-${resolverId}]`;
						}

						style.innerHTML = style.innerHTML.replace(/\s*\\?(?:>>>|\/deep\/|::v-deep)/, m => m[0] == '\\' ? m.substr(1) : scopeIdAttr);

						return processCssRules(style.sheet.cssRules, scopeIdAttr);
					}
					else {
						return style.innerHTML.trim();
					}
				});

				let script = doc.querySelector('script');
				if (script) {
					script = script.innerHTML;
					script = script.replace(/\bexport\s+default\s+/, 'const __sfc__ = ');
				}
				else {
					script = 'const __sfc__ = {};';
				}

				script = script.replace(/(\bimportVue\()/g, `$1'${url}', `);

				if (template) {
					script += '\n__sfc__.template = `' + template.replace(/`/g, '\\`').replace(/\$\{/g, '\\$${') + '`;';
				}
				if (scopeIdAttr) {
					script += `\n__sfc__.__scopeId = "data-v-${resolverId}";`;
				}

				if (styles.length) {
					script += "\nconst style = document.createElement('style');";
					script += "\nstyle.setAttribute('type', 'text/css');";
					script += `\nstyle.setAttribute('url', '${url}');`;
					script += `\nstyle.innerHTML = \`${styles.join('\n').replace('`', '\\`')}\`;`;
					script += "\ndocument.head.appendChild(style);";
				}
				script += `\nimportVue.resolvers['${resolverId}'](__sfc__);`;

				importVue.resolvers[resolverId] = resolve;
				let scriptEl = document.createElement('script');
				scriptEl.setAttribute('type', 'module');
				scriptEl.setAttribute('url', url);
				scriptEl.innerHTML = script;
				document.head.appendChild(scriptEl);
			})
			.then(component => {
				delete importVue.resolvers[resolverId];
				return importVue.resolved[url] = component;
			});
		});
}
importVue.resolvers = {};
importVue.resolved = {};
window.importVue = importVue;