/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module customers
 */

const express = require('express')
const mongoose = require('mongoose')
const Customer = require('./models/customer')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

var router = express.Router()
const privateKey = fs.readFileSync('.keys/jwtRS256.key')

/**
 * Middlewere for manage JWT. Add a token field in the req object
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    else {
        const publicKey = fs.readFileSync('.keys/jwtRS256.key.pub') // get public key
        jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
            if (err) return res.sendStatus(403)
            else {
                // Check if the user is authorized to perform the request operation
                if (decoded.role == 'customer') {
                    if (decoded._id != req.params.id) {
                        return res.sendStatus(403)
                    }
                }
                req.user = decoded
                next()
            }
        })
    }
}

router.post('/customers', (req, res) => {
    let data = req.body
    Customer.findOne({ username: data.username })
        .exec()
        .then((user) => {
            if (!user) {
                res.status(404).json({ message: 'User not found' })
            } else if (
                !bcrypt.compareSync(data.password || '', user.password)
            ) {
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
        })
        .catch((err) => {
            console.log(err)

            res.status(500).json({ message: 'Server error', error: err })
        })
})

module.exports = router
module.exports.verifyToken = verifyToken
