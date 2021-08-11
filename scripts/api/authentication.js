/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module customers
 */

const express = require('express')
const mongoose = require('mongoose')
const Customer = require('./models/customer')
const Employee = require('./models/employee')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

var router = express.Router()
const keysPath = path.join(global.rootDir, '.keys')
const privateKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key'))

/**
 * Middlewere for manage JWT. Add a token field in the req object
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    else {
        const publicKey = fs.readFileSync(
            path.join(keysPath, 'jwtRS256.key.pub')
        ) // get public key
        jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
            if (err) return res.sendStatus(403)
            else {
                // TODO - fattorizzare questo codice andando a richiamarlo solo con determinati URI
                // Check if the user is authorized to perform the request operation
                if (decoded.role == 'customer') {
                    if ((req.params.id && decoded._id != req.params.id) || (req.originalUrl.includes('products'))) {
                        return res.sendStatus(403)
                    }
                    // Check if the customer is requesting his own orders
                    if (req.originalUrl.includes('rentals')){
                        if (((req.query.customer && req.query.customer != decoded._id) || !req.query.customer) && req.method === "GET"){
                            return res.sendStatus(403)
                        }
                        if (req.body.customer != decoded._id && req.method === "POST"){
                            return res.sendStatus(403)
                        }
                    }
                }
                req.user = decoded
                next()
            }
        })
    }
}


function verifyUser(user, data, res){
    if (!user) {
        res.status(404).json({ message: 'User not found' })
    } else if (
        !bcrypt.compareSync(data.password || '', user.password)
    ) {
        console.log(user.password)
        res.status(403).json({ message: 'Wrong password' })
    } else {
        jwt.sign(
            {
                _id: user._id,
                user: user.username,
                role: user.role || 'customer',
            },
            privateKey,
            { expiresIn: '1h', algorithm: 'RS256' },
            (err, token) => {
                if (err)
                    res.status(500).json({ message: 'Internal error' })
                else res.status(200).json({ accesToken: token })
            }
        )
    }
}

function sendError(err){
    console.log(err)
    res.status(500).json({ message: 'Server error', error: err })
}

router.post('/customers', (req, res) => {
    let data = req.body
    Customer.findOne({ username: data.username })
        .exec()
        .then((user) => verifyUser(user, data, res))
        .catch(sendError)
})
router.post('/staff', (req, res) => {
    let data = req.body
    Employee.findOne({ username: data.username })
        .exec()
        .then((user) => verifyUser(user, data, res))
        .catch(sendError)
})


module.exports = router
module.exports.verifyToken = verifyToken
