/* exported api */
const api = (function() {
    const module = {};

    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id
            - (String) title
            - (String) author
            - (Date) date

        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date

    ****************************** */

    /**
     * This callback type is called `Callback` and is displayed as a
     * global symbol.
     *
     * @callback Callback
     * @param {boolean} err Whether an error occurred.
     * @param {Object} res The resulting data which is typically a JSON object.
     */


    /**
     * Creates AJAX request using multi-part formdata.
     *
     * @param {string} method - The HTTP method (i.e. GET, POST)
     * @param {string} url - The URL of the HTTP request
     * @param {Object} data - A JSON object that contains the data to send
     * @param {Callback} callback - The callback that handles the AJAX response
     */
    function sendFiles(method, url, data, callback) {
        const formdata = new FormData();
        Object.keys(data).forEach(function(key) {
            const value = data[key];
            formdata.append(key, value);
        });
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) {
                callback('[' + xhr.status + ']' + xhr.responseText, null);
            } else {
                callback(null, JSON.parse(xhr.responseText));
            }
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    /**
     * Creates AJAX request.
     *
     * @param {string} method - The HTTP method (i.e. GET, POST)
     * @param {string} url - The URL of the HTTP request
     * @param {Object} data - A JSON object that contains the data to send
     * @param {Callback} callback - The callback that handles the AJAX response
     */
    function send(method, url, data, callback) {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) {
                callback('[' + xhr.status + ']' + xhr.responseText, null);
            } else {
                callback(null, JSON.parse(xhr.responseText));
            }
        };
        xhr.open(method, url, true);
        if (!data) {
            xhr.send();
        } else {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    module.getCurrentUser = function() {
        const l = document.cookie.split('username=');
        if (l.length > 1) return l[1];
        return null;
    };

    // TODO: Create a nav .pug and add that to the various views instead.
    // It's important to make sure that the active link is still highlighted
    // and that unauthorized users can't see the Sell link.
    module.makeNavbar = function() {
        const navBar = document.querySelector('nav');
        const navHeadersAuthorized = [
            {url: '/', text: 'Home'},
            {url: '/create-listing.html', text: 'Sell'},
            {url: '/credits.html', text: 'Credits'},
        ];
        const navHeadersUnauthorized = [
            {url: '/', text: 'Home'},
            {url: '/credits.html', text: 'Credits'},
        ];
        const navHeaders = module.getCurrentUser() ?
            navHeadersAuthorized : navHeadersUnauthorized;
        let navBarHTML = `
            <nav class="navbar navbar-expand-md navbar-dark bg-blue">
            <a href="/" class="navbar-brand abs" id="nav-title">
                <img src="/media/logo.png" class="logo-icon"/>
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" 
            data-target="#collapsingNavbar">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="navbar-collapse collapse" id="collapsingNavbar">
                <ul class="navbar-nav">`;
        for (let navElement of navHeaders) {
            let newListElement = '<li class="nav-item">';
            if (window.location.pathname == navElement.url) {
                newListElement = '<li class="nav-item active">';
            }
            navBarHTML += `
            ${newListElement}
                <a class="nav-link" href="${navElement.url}">
                    ${navElement.text}
                </a>
            </li>
            `;
        }
        navBarHTML += `
                </ul>
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item">
                        <a href="/signin" id="signin-button" 
                        class="hidden nav-link">Sign in / Sign up</a>
                        <a href="/api/signout/" id="signout-button" 
                        class="hidden nav-link">Sign out</a>
                    </li>
                </ul>
            </div>
        </nav>`;

        navBar.innerHTML = navBarHTML;

        if (!module.getCurrentUser()) {
            document.querySelector('#signin-button')
            .classList.remove('hidden');
        } else {
            document.querySelector('#signout-button')
            .classList.remove('hidden');
        }
    };

    module.pageSize = 20;

    module.signup = function(username, password, email, callback) {
        send('POST', '/api/signup/', {
            username: username,
            password: password,
            email: email}, callback);
    };

    module.signin = function(username, password, callback) {
        send('POST', '/api/signin/', {
            username: username,
            password: password}, callback);
    };

    module.signout = function(callback) {
        send('POST', '/api/signout/', null, callback);
    };

    module.addListing = function(category, title, file, description,
    price, callback) {
        sendFiles('POST', '/api/listings/', {
            category: category,
            title: title,
            picture: file,
            description: description,
            price: price,
        }, callback);
    };

    module.getListings = function(page, callback) {
        const offset = page * module.pageSize;
        send('GET', '/api/listings/?limit=' + module.pageSize +
            '&offset=' + offset, null, callback);
    };

    module.deleteListing = function(id, callback) {
        send('DELETE', '/api/listings/' + id + '/', null, callback);
    };

    return module;
})();
