var cron = require('node-cron')
const Rep = require('./api/models/reparation')
const Item = require('./api/models/item')
const Rent = require('./api/models/rent')
const support = require('./api/support')

// Number of days before the start of the rent for substituding a item that is late
const days = 2
const period = '*/5 * * * * *'

// The schedule time must be changed for real use
var reparations = cron.schedule(
    period,
    async () => {
        let today = new Date()
        let reps = await Rep.find({ end: { $lte: today }, terminated: false })
        for (const rep of reps) {
            for (const item of rep.products) {
                await Item.updateOne({ _id: item }, { condition: 'perfect' })
            }
            await Rep.updateOne({ _id: rep._id }, { terminated: true })
        }
    },
    { scheduled: false }
)

var delay = cron.schedule(
    period,
    async () => {
        let today = new Date()
        let rents = await Rent.find({
            $or: [
                { end: { $lte: today }, state: 'in progress' },
                { state: 'delayed' },
            ],
        })

        for (const rent of rents) {
            for (const item of rent.products) {
                await support.replaceItemPeriod(
                    item,
                    support.addDays(today, 1),
                    support.addDays(today, days)
                )
            }
            if (rent.state != 'delayed')
                console.log(
                    await Rent.updateOne(
                        { _id: rent._id },
                        { state: 'delayed' }
                    )
                )
        }
    },
    { scheduled: false }
)

async function startRoutines() {
    reparations.start()
    delay.start()
}

exports.startRoutines = startRoutines
