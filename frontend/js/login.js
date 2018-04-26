(function() {
    'use strict';

    window.addEventListener('load', function() {
        /**
         * Submits the sign up/sign in form.
         */
        function submit() {
            if (document.querySelector('form').checkValidity()) {
                const username = document.querySelector(
                    'form [name=username]').value;
                const password = document.querySelector(
                    'form [name=password]').value;
                const action = document.querySelector(
                    'form [name=action]').value;
                if (action == 'signup') {
                    const email = document.querySelector(
                        'form [name=email]').value;
                    api[action](username, password, email, function(err, res) {
                        if (err) {
                            document.querySelector('.alert').innerHTML = err;
                        } else {
                            window.location = '/';
                        }
                    });
                } else {
                    api[action](username, password, function(err, res) {
                        if (err) {
                            document.querySelector('.alert').innerHTML = err;
                        }
                        else window.location = '/';
                    });
                }
            }
        }

        const signInButton = document.querySelector('#signin');
        if (signInButton) {
            signInButton.addEventListener('click', function(e) {
                document.querySelector('form [name=action]').value = 'signin';
                submit();
            });
        }

        const signUpButton = document.querySelector('#signup');
        if (signUpButton) {
            signUpButton.addEventListener('click', function(e) {
                document.querySelector('form [name=action]').value = 'signup';
                submit();
            });
        }

        document.querySelector('form')
        .addEventListener('submit', function(e) {
            e.preventDefault();
        });

        api.makeNavbar();
    });
}());
