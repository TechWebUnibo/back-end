/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */
const express = require('express')
const mongoose = require('mongoose')
const Employee = require('./models/employee')
const auth = require('./authentication')


var router = express.Router()

/**
 * Add a new employee.
 * @param {object} data Data of the new employee
 * @param {res} res Response object
 */
router.post('/', (req, res) => {
    const data = req.body
    data.password = bcrypt.hashSync(data.password, 14)
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
        .catch((err) =>
            res.status(400).json({ message: 'Bad input parameter', error: err })
        )
})

/**
 * Return all the staff members.
 * @param {res} res Response object
 */
router.get('/', (req, res) => {
    Employee.find()
        .exec()
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Server error', error: err })
        })
})


router.delete('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    Employee.findOneAndDelete({ _id: id })
        .exec()
        .then((result) => {
            if(result)
                res.status(200).json({
                    message: 'Employee deleted',
                    employee: result,
                })
            else
                res.status(404).json({
                    message: 'Employee not found',
                    employee: result,
                })
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Employee not found',
                error: err,
            })
        })
})

// Modify a staff member
router.post('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    let newData = req.body
    newData.password = bcrypt.hashSync(newData.password, 14)
    Employee.findOneAndUpdate(
        { _id: id },
        { $set: newData },
        { runValidators: true, new: false, useFindAndModify: false }
    )
        .exec()
        .then((result) => {
            if (result)
                res.status(200).json({
                    message: 'Data modified',
                    employee: result,
                })
            else
                res.status(404).json({
                    message: 'Employee not found',
                    employee: result,
                })
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

module.exports = router
