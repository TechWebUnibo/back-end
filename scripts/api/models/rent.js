/**
 * @file Rent schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Customer = require('./customer')
const Employee = require('./employee')
const Items = require('./item')
const Product = require('./product')

const rentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        validate: {
            validator: (id) => {
                return Customer.exists({ _id: id })
            },
            message: 'Invalid customer',
        },
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        validate: {
            validator: (id) => {
                return Employee.exists({ _id: id })
            },
            message: 'Invalid employee',
        },
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true,
            validate: {
                validator: (id) => {
                    return Items.exists({ _id: id })
                },
                message: 'Invalid product',
            },
        },
    ],

    productType:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
        validate: {
            validator: (id) => {
                return Product.exists({ _id: id })
            },
            message: 'Invalid product',
        },
        validate:{
            validator: function(id){
                return Promise.resolve(checkProductType(id, this.products,))
            },
            message: 'The category inserted does not match with the products'
        }

    },
    price: {
        type: Number,
        required: true,
    },

    start: {
        type: Date,
        required: true,
    },
    end: {
        type: Date,
        required: true,
        validate: {
            validator: function () {
                return this.start <= this.end
            },
            message: 'Start should be before the end of the rent',
        },
    },

    state: {
        type: String,
        required: true,
        enum: [
            'not_started',
            'cancelled',
            'in_progress',
            'delayed',
            'terminated',
        ],
    },
})



/** 
* Check if the product type is correct and corresponds to the type of the item rented.
* @param {Id} productType - Type of the product rented.
* @param {Array} items - Items to be rented.
* @return {Boolean}
*/

async function checkProductType(productType, items) {
    productType = await Product.findOne({ _id: productType })

    if (productType) {
        if (productType.products.length === 0) {
            const fullItem = await Items.findOne({ _id: items[0] })
            return (items.length === 1 && productType._id.equals(fullItem.type))
        }
        else {
            if (items.length !== productType.products.length){
                return false
            }
            else{
                let checkFlag = true
                let i = 0
                console.log(items.length)
                while (checkFlag && i < items.length) {
                    let fullItem = await Items.findOne({ _id: items[i] })
                    checkFlag = productType.products.includes(fullItem.type.toString())
                    i = i + 1
                }
                return checkFlag
            }
        }
    }
    else {
        return false
    }
}

// TODO - come tenere traccia del noleggio di un bundle?
// per i prodotti non c'e' problema si ricercano e si vedono se sono disponibili
// non si saprebbe pero' se tali oggetti sono stati presi con un bundle o meno

module.exports = mongoose.model('Rent', rentSchema)
