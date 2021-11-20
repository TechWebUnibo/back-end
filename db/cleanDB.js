const mongoose = require('mongoose')
require('dotenv').config({ path: './.env' })


class Cleaner {

    constructor () {
        this.db = mongoose.connection
        // console.log(process.env.MONGO_URI)
        // Connect the database
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        this.db.on('error', console.error.bind(console, 'connection error:'))
        this.db.once('open', function () {
            console.log('Connected to Mongo!')
        })
    }

    async clean (collection) {
        try {
            await this.db.dropCollection(collection);
        }
        catch (err) {
            console.log(err)
        }
    }
    
    async cleaner () {
        const args = process.argv.slice(2)
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
cleaner.cleaner()