/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */
const express = require('express')
const mongoose = require('mongoose')
const Employee = require('./models/employee')

var router = express.Router()

/**
 * Add a new employee.
 * @param {object} data Data of the new employee
 * @param {res} res Response object
 */
router.post('/', (req, res) => {
    const data = req.body
    data._id = new mongoose.Types.ObjectId()
    const newEmployee = new Employee(data)
    newEmployee
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Employee created',
                employee: newEmployee,
            })
        })
        .catch((err) => res.status(400).json({ error: err }))
})

/**
 * Return all the staff members.
 * @param {res} res Response object
 */
router.get('/api/staff/', (req, res) => {
    Employee.find()
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ error: err })
        })
})

module.exports = router
