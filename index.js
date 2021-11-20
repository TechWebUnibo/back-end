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
const scripts = require('./scripts/api/db')
const rentals = require('./scripts/api/rentals')
const notifications = require('./scripts/api/notifications')
const invoices = require('./scripts/api/invoices')
const reparations = require('./scripts/api/reparations')
const history = require('connect-history-api-fallback')
const path = require('path')

const dotenv = require('dotenv')
require('dotenv').config({ path: path.resolve(global.rootDir + "/.env") });

console.log(process.env.MONGO_URI)

const routines = require('./scripts/routines')

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

app.use('/img', express.static(global.rootDir + '/public/media/img'))

app.use(
    history({
        rewrites: [
            {
                from: /management-dashboard(\W|\w)*/,
                to: '/management-dashboard',
            },
            {
                from: /^\/api\/.*$/,
                to: function (context) {
                    return context.parsedUrl.path
                },
            },
            {
                from: /\/(\W|\w)*/,
                to: '/',
            },
        ],
        disableDotRule: false,
    })
)

// Set APIs route
app.use('/api/customers/', customers)
app.use('/api/staff/', staff)
app.use('/api/auth/', auth)
app.use('/api/items/', items)
app.use('/api/products/', products)
app.use('/api/rentals/', rentals)
app.use('/api/invoices/', invoices)
app.use('/api/reparations/', reparations)
app.use('/api/notifications/', notifications)
app.use('/api/scripts/', scripts)

// Connect the database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to Mongo!')
})

routines.startRoutines()

app.get('/management-dashboard', (req, res) => {
    res.sendFile(
        global.rootDir + '/public/html/management-dashboard/index.html'
    )
})
app.get('/', (req, res) => {
    res.sendFile(global.rootDir + '/public/index.html')
})

app.listen(port, () => {
    console.log('Server is listening...')
})
