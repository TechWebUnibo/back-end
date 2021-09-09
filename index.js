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
const invoices = require('./scripts/api/invoices')
const reparations = require('./scripts/api/reparations')
const Rep = require('./scripts/api/models/reparation')
const Item = require('./scripts/api/models/item')
var cron = require('node-cron');



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
app.use('/api/invoices/', invoices)
app.use('/api/reparations/', reparations)

// Connect the database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to Mongo!')
})


// The schedule time must be changed for real use
cron.schedule('*/5 * * * * *', async () => {
    console.log('Checking reparations...')
    let today = new Date()
    let reps = await Rep.find({ end: { $lte: today }, terminated: false})
    for(const rep of reps){
        for(const item of rep.products){
            await Item.updateOne({_id: item}, {condition: 'perfect'})
        }
        await Rep.updateOne({ _id: rep._id }, { terminated: true})
    }
    console.log('Check end...')
});

app.listen(port, () => {
    console.log('Server is listening...')
})
