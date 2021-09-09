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

function addDays(date, days) {
    var result = new Date(date)
    result.setDate(result.getDate() + days)
    return result.toISOString().split('T')[0]
}

async function getAvailable(id, start, end, rent) {
    let items = await Item.find({
        type: id,
        condition: { $ne: 'not available' },
    })
    let freeItems = []
    for (let item of items) {
        let occupied = await checkAvailability(item._id, start, end, rent)
        if (!occupied) {
            freeItems.push(item)
        }
    }
    return freeItems
}

/**
 * Check if a list items is available in the given date.
 * @summary Check if an item is available.
 * @param {Array} items - Item to be checked
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {String} rent - Rent to exclude in the research
 * @return {Boolean} Brief description of the returning value here.
 */
async function checkItems(items, start, end, rent) {
    for (let item of items) {
        let occupied = await checkAvailability(item, start, end, rent)
        // If some article is no more available notify the user
        if (occupied) return true
    }
    return false
}

/**
 * Check if a item is available in the given date.
 * @summary Check if an item is available.
 * @param {Array} item - Item to be checked
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @param {String} rent - Rent to exclude in the research
 * @return {Boolean} Brief description of the returning value here.
 */
async function checkAvailability(item, start, end, rent) {
    let query = {
        products: item,
        $or: [
            { state: { $ne: 'cancelled' } },
            { state: { $ne: 'terminated' } },
        ],
        $or: [
            { start: { $gte: start, $lte: end } },
            { end: { $gte: start, $lte: end } },
            { start: { $lte: start }, end: { $gte: end } },
        ],
    }
    if (rent) query._id = { $ne: rent }
    let occupied = await Rent.exists(query)
    let tmp = await Rep.exists({
        products: item,
        $or: [
            { state: { $ne: 'cancelled' } },
            { state: { $ne: 'terminated' } },
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
function getCheapest(items, start, end) {
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
    const conditions = { perfect: 0, good: 0.05, suitable: 0.1, broken: 0 }
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
function computeState(start, end) {
    let state
    if (Date.now() < Date.parse(start)) state = 'not started'
    else if (Date.now() > Date.parse(start) && Date.now() < Date.parse(end)) {
        state = 'in progress'
    } else {
        state = 'terminated'
    }
    return state
}

/**
 * Replace the current item for all the rentals in the given period. If no
 * item is available the rent is cancelled.
 * @param {*} item Item to be replaced
 * @param {*} condition Condition of the item
 * @param {*} start Start period
 * @param {*} end  End period
 */
async function replaceItem(item, condition, start, end) {
    let query = {}
    if (end) {
        query = {
            products: item,
            $or: [
                { state: { $ne: 'cancelled' } },
                { state: { $ne: 'terminated' } },
            ],
            $or: [
                { start: { $gte: start, $lte: end } },
                { end: { $gte: start, $lte: end } },
                { start: { $lte: start }, end: { $gte: end } },
            ],
        }
    } else {
        query = {
            products: item,
            $or: [
                { state: { $ne: 'cancelled' } },
                { state: { $ne: 'terminated' } },
            ],
            start: { $gte: start },
        }
    }

    // Search for all the rentals that use that item in the given period
    let rentals = await Rent.find(query)

    let fullItem = await Item.findOneAndUpdate(
        { _id: item },
        { condition: condition }
    )

    for (const rent of rentals) {
        let freeItems = await getAvailable(fullItem.type, rent.start, rent.end)
        // If there are not replacement, the rental must be cancelled
        if (freeItems.length === 0) {
            await Rent.findOneAndUpdate(
                { _id: rent._id },
                { state: 'cancelled' },
                { useFindAndModify: true }
            )
        } else {
            // If there is a replacement, the item is replaced
            await Rent.updateOne(
                { _id: rent._id, products: item },
                {
                    $set: {
                        'products.$': getCheapest(
                            freeItems,
                            rent.start,
                            rent.end
                        )._id,
                    },
                }
            )
        }
    }
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
async function makeBroken(items, condition, start, end) {
    for (const item of items) await replaceItem(item, condition, start, end)
    if (end) {
        let rep = new Rep({
            _id: new mongoose.Types.ObjectId(),
            start: start,
            end: end,
            products: items,
        })

        await rep.save()
    }
}

exports.computePrice = computePrice
exports.getAvailable = getAvailable
exports.checkAvailability = checkAvailability
exports.checkItems = checkItems
exports.getCheapest = getCheapest
exports.makeBroken = makeBroken
exports.computeState = computeState
exports.replaceItem = replaceItem
exports.addDays = addDays
