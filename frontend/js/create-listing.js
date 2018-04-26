(function() {
    'use strict';
    window.onload = function() {
        document.getElementById('create-listing-form')
        .addEventListener('submit', function(e) {
            // Prevent page refresh
            e.preventDefault();
            // Read form elements
            const category = document.getElementById('category').value;
            const title = document.getElementById('title').value;
            const file = document.getElementById('picture-file').files[0];
            const description = document.getElementById('description').value;
            const price = document.getElementById('price').value;

            api.addListing(category, title, file, description, price,
            function(err, listing) {
                if (err) {
                    document.getElementById('notifications').innerHTML = err;
                } else {
                    // Clear form
                    document.getElementById('create-listing-form').reset();
                    document.getElementById('notifications').innerHTML =
                        'Listing was added successfully!';
                }
            });
        });

        api.makeNavbar();
    };
}());
