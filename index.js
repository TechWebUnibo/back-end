/**
 * @file Entry point
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

global.rootDir = __dirname

// Imports
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const customers = require('./scripts/api/customers')
const staff = require('./scripts/api/staff')
const auth = require('./scripts/api/authentication')
const items = require('./scripts/api/items')
const products = require('./scripts/api/products')
const rentals = require('./scripts/api/rentals')

// Constants
const mongoCredentials = {
    user: 'site202118',
    pwd: 'om7Dieru',
    site: 'mongo_site202118',
}

const uri = `mongodb://localhost:27017/NoloNoloPlus`
const port = 8000
const db = mongoose.connection

app = express()
app.use(cors())
app.use(express.json())

// Define static paths
app.use('/js', express.static(global.rootDir + '/public/js'))
app.use('/css', express.static(global.rootDir + '/public/css'))
app.use('/data', express.static(global.rootDir + '/public/data'))
app.use('/docs', express.static(global.rootDir + '/public/html'))
app.use('/img', express.static(global.rootDir + '/public/media/img'))

// Set APIs route
app.use('/api/customers/', customers)
app.use('/api/staff/', staff)
app.use('/api/login/', auth)
app.use('/api/items/', items)
app.use('/api/products/', products)
app.use('/api/rentals/', rentals)

// Connect the database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to Mongo!')
})

app.listen(port, () => {
    console.log('Server is listening...')
})
