(function () {
	'use strict';
	if(!window.XDomainRequest || 'withCredentials' in window.XMLHttpRequest) { return; }

	function borrow(from, prop) { return typeof(from[prop]) === 'function' ? from[prop].bind(from) : from[prop]; }
	var OriginalXMLHttpRequest = window.XMLHttpRequest;

	window.location.origin = window.location.origin || window.location.protocol + '//' + window.location.host;
	function isXDomain(url) {
		return (url.length > 1 && url[1] === '/') || url.slice(0, window.location.origin.length) !== window.location.origin;
	}

	window.XMLHttpRequest = function () {
		var implementation = null;

		this.open = function (method, url) {
			function response(status) {
				return function () {
					this.responseText = implementation.responseText;
					this.readyState = 4;
					this.status = status;
					if(this.onreadystatechange) { this.onreadystatechange(); }
				};
			}

			if(!isXDomain(url)) {
				implementation = new OriginalXMLHttpRequest();

				implementation.onreadystatechange = function () {
					if(implementation.readyState === 4) {
						['readyState', 'status', 'responseText'].forEach(function (prop) { this[prop] = borrow(implementation, prop); }.bind(this));
					}
					if(this.onreadystatechange) { this.onreadystatechange(); }
				}.bind(this);

				['abort', 'send', 'getAllResponseHeaders', 'getResponseHeader', 'setRequestHeader'].forEach(function (fn) {
					this[fn] = borrow(implementation, fn);
				}.bind(this));
			} else {
				implementation = new window.XDomainRequest();

				implementation.onload = response(200).bind(this);
				implementation.onerror = response(400).bind(this);

				['abort', 'send'].forEach(function (fn) { this[fn] = borrow(implementation, fn); }.bind(this));
				['getResponseHeader', 'getAllResponseHeaders', 'setRequestHeader'].forEach(function (fn) { this[fn] = function () {}; }.bind(this));
			}

			implementation.open.apply(implementation, arguments);
		};
	};
})();
