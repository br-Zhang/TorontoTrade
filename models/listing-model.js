const mongoose = require('mongoose');
// Will add the Currency type to the Mongoose Schema types
require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

const listingSchema = new mongoose.Schema({
    title: String,
    price: {
        type: Currency,
    },
    category: String,
    description: String,
    updated: {
        type: Date,
        default: Date.now,
    },
    image_url: String,
    image_id: String,
});

module.exports = mongoose.model('Listing', listingSchema);
