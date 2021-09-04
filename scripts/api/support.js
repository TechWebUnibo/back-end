/**
 * @file Function shared between APis
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 */

const mongoose = require('mongoose')
const Item = require('./models/item')
const Product = require('./models/product')
const Rent = require('./models/rent')
const Rep = require('./models/reparation')

async function getAvailable(id, start, end) {
    let items = await Item.find({
        type: id,
        condition: { $ne: 'not available' },
    })
    let freeItems = []
    for (let item of items) {
        let occupied = await checkAvailability(item._id, start, end)
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
async function checkAvailability(item, start, end) {
    let occupied = await Rent.exists({
        products: item,
        $or: [
            {state: {$ne:'cancelled'}},
            {state: {$ne: 'terminated'}}
        ],
        $or: [
            { start: { $gte: start, $lte: end } },
            { end: { $gte: start, $lte: end } },
            { start: { $lte: start }, end: { $gte: end } },
        ],
    })
    let tmp = await Rep.exists({
        products: item,
        $or: [
            { state: { $ne: 'cancelled' } },
            { state: { $ne: 'terminated' } }
        ],
        $or: [
            { start: { $gte: start, $lte: end } },
            { end: { $gte: start, $lte: end } },
            { start: { $lte: start }, end: { $gte: end } },
        ],
    })
    return occupied || tmp
}


/**
 * Select the cheapest item of a category
 * @summary Price for the rent.
 * @param {Object} items - Items available
 * @return {Number} The cheapest item
 */
function getCheapest(items, start, end){
    return items.reduce(
        (chosen, item) =>
            computePrice([item], start, end) <
                computePrice([chosen], start, end)
                ? item
                : chosen,
        items[0]
    )
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
    const conditions = { perfect: 0, good: 0.05, suitable: 0.1 , broken: 0}
    const bundleDiscount = 0.1
    const renewTime = 86400000

    // To obtain the number of days: perform a integer division of the timestamp difference with the value of a day
    const days =
        Math.round((Date.parse(end) - Date.parse(start)) / renewTime) + 1
    let price = 0
    for (let item of items) {
        price = price + item.price - item.price * conditions[item.condition]
    }
    price = price * days
    if (items.length > 1) price = price - price * bundleDiscount
    return Math.floor(price)
}


/**
 * Compute the state of a rent
 * @param {Date} start - Start of the rent 
 * @param {Date} end - End of the rent
 * @returns 
 */
function computeState(start, end){
    let state
    if(Date.now() < Date.parse(start))
        state = 'not started'
    else if (Date.now() > Date.parse(start) && Date.now() < Date.parse(end)){
        state = 'in progress'
    }
    else{
        state = 'terminated'
    }
    return state
}


/**
 * Make a product unavailable for a given period.
 * @summary Make an item unavailable.
 * @param {Object} item - Items unavailabke.
 * @param {Date} start - Start of the period
 * @param {Date} end - End of the period
 * @param {Date} price - Price of the reparation
 * @param {Date} employee - Employee that is making the product unavailable
 */
async function makeBroken(item, start, end){
    // Search for all the rentals that use that item in the given period
    let rentals = await Rent.find({
        products: item,
        $or: [
            { state: { $ne: 'cancelled' } },
            { state: { $ne: 'terminated' } }
        ],
        $or: [
            { start: { $gt: start, $lte: end } },
            { end: { $gt: start, $lt: end } },
            { start: { $lte: start }, end: { $gte: end } },
        ],
    })
    console.log(start, end, rentals, item)
    let fullItem = await Item.findOneAndUpdate({_id: item}, {condition: 'broken'})

    for(const rent of rentals){
        let freeItems = await getAvailable(fullItem.type, start, end)
        console.log(freeItems)
        // If there are not replacement, the rental must be cancelled
        if(freeItems.length === 0){
            await Rent.findOneAndUpdate({_id: rent._id}, {state: 'cancelled'})
        }
        else{
            // If there is a replacement, the item is replaced
            await Rent.findOneAndUpdate({ _id: rent._id, products: item}, { $set: {'products.$': getCheapest(freeItems, start, end)._id} })
        }
    }

    let rent = new Rep({
        _id: new mongoose.Types.ObjectId(),
        start: start,
        end: end,
        products: [item],
        state: computeState(start, end)
    })

    await rent.save()
}

exports.computePrice = computePrice
exports.getAvailable = getAvailable
exports.checkAvailability = checkAvailability
exports.getCheapest = getCheapest
exports.makeBroken = makeBroken
exports.computeState = computeState
