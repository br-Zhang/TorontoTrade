const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderDate: {
        type: Date,
        default: Date.now,
    },
    listingId: mongoose.SchemaTypes.ObjectId,
    sellerId: mongoose.SchemaTypes.ObjectId,
    buyerId: mongoose.SchemaTypes.ObjectId,
});

module.exports = mongoose.model('Order', orderSchema);
