/**
 * @file Entry point
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

// Imports
const express = require('express')
const mongoose = require('mongoose')
const customers = require('./scripts/api/customers')
const staff = require('./scripts/api/staff')

// Constants
const uri = 'mongodb://localhost:27017'
const port = 8000
const db = mongoose.connection

app = express()
app.use(express.json())

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to Mongo!')
})

app.post('/api/customers/', (req, res) => {
    customers.addCustomer(req.body, res)
})

app.get('/api/customers/', (req, res) => {
    customers.getCustomers(res)
})

app.post('/api/staff/', (req, res) => {
    staff.addEmployee(req.body, res)
})

app.get('/api/staff/', (req, res) => {
    staff.getEmployees(res)
})

app.listen(port, () => {
    console.log('Server is listening...')
})
