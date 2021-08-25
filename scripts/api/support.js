/**
 * @file Function shared between APis
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 */


const Item = require('./models/item')
const Product = require('./models/product')
const Rent = require('./models/rent')

async function getAvailable(id, start, end) {
    let items = await Item.find({ type: id, condition: {$ne: 'not available'} })
    let freeItems = []
    for (let item of items) {
        let occupied = await checkAvailability(item, start, end)
        if (!occupied) {
            freeItems.push(item)
        }
    }
    return freeItems
}

/** 
* Check if a item is available in the given date.
* @summary Check if an item is available.
* @param {Array} items - Item to be checked
* @param {Date} start - Start date
* @param {Date} end - End date
* @return {Boolean} Brief description of the returning value here.
*/
async function checkAvailability(item, start, end){
    return occupied = await Rent.exists({
        products: item,
        $or: [
            { start: { $gte: start, $lte: end } },
            { end: { $gte: start, $lte: end } },
            { start: { $lte: start }, end: { $gte: end } },
        ],
    })
}

/**
 * Compute the price for the given item
 * @summary Price for the rent.
 * @param {Object} item - Items to rent.
 * @param {Date} start - Start of the rent
 * @param {Date} end - End of the rent
 * @return {Number} Price of the rent
 */
function computePrice(items, start, end) {
    const conditions = { perfect: 0, good: 0.05, suitable: 0.1 }
    const bundleDiscount = 0.1
    const renewTime = 86400000

    // To obtain the number of days: perform a integer division of the timestamp difference with the value of a day
    const days =
        Math.round((Date.parse(end) - Date.parse(start)) / renewTime) + 1
    let price = 0
    for (let item of items){
        price = price + item.price - item.price * conditions[item.condition]
    }
    price = price * days
    if (items.length > 1) price = price - price * bundleDiscount
    return Math.floor(price);
}


exports.computePrice = computePrice
exports.getAvailable = getAvailable
exports.checkAvailability = checkAvailability