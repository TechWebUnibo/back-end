/**
 * @file Notification management
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const Notification = require('./models/notification')
const mongoose = require('mongoose')

async function createNotification(customer, rent, state) {
    const _id = new mongoose.Types.ObjectId()
    const newN = new Notification({ _id, customer, rent, state, date: new Date() })
    try {
        await newN.save()
    } catch (err) {
        console.log(err)
    }
}

exports.createNotification = createNotification
