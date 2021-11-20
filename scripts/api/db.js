
const express = require('express')
const mongoose = require('mongoose')


var router = express.Router()

class Cleaner {

    constructor() {
        this.db = mongoose.connection
        console.log(process.env.MONGO_URI)
        // Connect the database
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        this.db.on('error', console.error.bind(console, 'connection error:'))
        this.db.once('open', function () {
            console.log('Connected to Mongo!')
        })
    }

    async clean(collection) {
        console.log('Cleaning ' + collection)
        try {
            await this.db.dropCollection(collection);
        }
        catch (err) {
            //console.log(err)
        }
    }

    async cleaner(args) {
        if (args.length === 0) {
            console.log('No args inserted, nothing to clean...')
        }
        for (const val of args) {
            await this.clean(val);
        }
        this.db.close()
    }

}
const cleaner = new Cleaner()


router.post('/clean', async (req, res) => {
    const body = req.body
    try {
        await cleaner.cleaner(body)
        res.status(200).json('Everything fine')
    }
    catch (err){
        res.status(500).json(err)
    }
})


module.exports = router