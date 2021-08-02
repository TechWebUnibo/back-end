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
const mongoCredentials = {
    user: 'site202118',
    pwd: 'om7Dieru',
    site: 'mongo_site202118',
}

//const uri = `mongodb://${mongoCredentials.user}:${mongoCredentials.pwd}@${mongoCredentials.site}/NoloNoloPlus?writeConcern=majority`
const uri = `mongodb://localhost:27017/NoloNoloPlus`;
const port = 8000;
const db = mongoose.connection;

app = express()
app.use(express.json())

// Set APIs route
app.use('/api/customers/', customers)
app.use('/api/staff/', staff)

// Connect the database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to Mongo!')
})

app.listen(port, () => {
    console.log('Server is listening...')
})
