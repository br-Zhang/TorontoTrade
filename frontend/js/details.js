(function() {
    'use strict';

    window.addEventListener('load', function() {
        api.makeNavbar();

        const buyButton = document.querySelector('.buy-btn');
        buyButton.addEventListener('click', function() {
            location.href = '/purchase/' + buyButton.id;
        });
    });
}());
