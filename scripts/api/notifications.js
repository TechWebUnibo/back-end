/**
 * @file API for managing the notification
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 */
const express = require('express')
const mongoose = require('mongoose')
const Notification = require('./models/notification')
const auth = require('./authentication')
const Customer = require('./models/customer')


var router = express.Router()

router.get('/customers/:id', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    try{
        const exist = await Customer.exists({_id: id})
        if (!exist){
            res.status(404).json({message: 'Customer not found'})
        }
        const results = await Notification.find({customer: id, checked: false})
        res.status(200).json(results)
    }
    catch{
        console.log(err)
        res.status(500).json(err)
    }
})

// Make a notification checked
router.post('/customers/check/:id', async (req, res) => {
    const id = req.params.id
    try{
        const exist = await Notification.exists({_id: id})
        if (!exist){
            res.status(404).json({message: 'Notification not found'})
        }
        const results = await Notification.findByIdAndUpdate(id, {checked: true})
        res.status(200).json(results)
    }
    catch{
        console.log(err)
        res.status(500).json(err)
    }
})

module.exports = router
