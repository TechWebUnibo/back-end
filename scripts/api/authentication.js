/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module customers
 */

const express = require('express')
const Customer = require('./models/customer')
const Employee = require('./models/employee')
const Rent = require('./models/rent')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { decode } = require('punycode')

var router = express.Router()
const keysPath = path.join(global.rootDir, '.keys')
const privateKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key'))

/**
 * Verify if the user has the permission to get or start a new rent. A user can't start a rent
 * for another and he cannot ask for the rentals of another one
 * @summary Verify if the user has the permission to get or start a new rent
 * @param {String} id - Id found in JWT
 */
function verifyRentAuth(req, res, id, next) {
    // Time before the rent is not cancellable anymore
    const elapseTime = 604800000 // A week
    if (
        req.method === 'GET' &&
        ((req.query.customer && req.query.customer != id) ||
            !req.query.customer)
    ) {
        return res.sendStatus(403).end()
    }
    if (
        req.body.customer != id &&
        req.method === 'POST' &&
        !req.params.rentId
    ) {
        return res.sendStatus(403).end()
    }
    // For modifing and deleting the user must owns the rent and he can perform the operation
    // until a certain time before the start of the rent
    if (
        req.method === 'DELETE' ||
        (req.method === 'POST' && req.params.rentId)
    ) {
        Rent.findOne({ _id: req.params.rentId })
            .exec()
            .then((result) => {
                // Check if the user is deleting a rental that owns
                if (result) {
                    if (result.customer != id) return res.sendStatus(403).end()
                    else if (
                        Date.parse(result.start) - elapseTime <
                        Date.now()
                    ) {
                        return res.sendStatus(403).end()
                    } else next()
                }
            })
            .catch((err) => {
                res.status(404)
                    .json({
                        message: 'Rental not found',
                        error: err,
                    })
                    .end()
            })
    } else next()
}

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
            if (err) return res.sendStatus(401)
            else {
                // TODO - fattorizzare questo codice andando a richiamarlo solo con determinati URI
                // Check if the user is authorized to perform the requested operation
                // staff member can perform every operation
                if (decoded.role == 'customer') {
                    if (
                        (req.params.id && decoded._id != req.params.id) ||
                        req.originalUrl.includes('items')
                    )
                        return res.sendStatus(403)
                    else if (req.originalUrl.includes('rentals'))
                        verifyRentAuth(req, res, decoded._id, next)
                    else next()
                } else next()
            }
        })
    }
}
/**
 * Middleware used to check if a user is logged
 * @summary If a user has a valid token add the token information to the request object
 */

function verifyLogin(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const publicKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key.pub')) // get public key
    if (token != null) {
        jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
            if (!err) req.user = decoded
        })
    }
    next()
}

/**
 * Authenticate a customer or a staff member. Generate a JWT token for later authorizations
 * @param {*} user User to authenticate
 * @param {*} data Data provided
 * @param {*} res Response object
 */
function verifyUser(user, data, res) {
    if (!user) {
        res.status(404).json({ message: 'User not found' })
    } else if (!bcrypt.compareSync(data.password || '', user.password)) {
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
                if (err) res.status(500).json({ message: 'Internal error' })
                else res.status(200).json({ accessToken: token, id: user._id })
            }
        )
    }
}

function sendError(err) {
    console.log(err)
    res.status(500).json({ message: 'Server error', error: err })
}

router.post('/login/customers', (req, res) => {
    let data = req.body
    Customer.findOne({ username: data.username })
        .exec()
        .then((user) => verifyUser(user, data, res))
        .catch(sendError)
})
router.post('/login/staff', (req, res) => {
    let data = req.body
    Employee.findOne({ username: data.username })
        .exec()
        .then((user) => verifyUser(user, data, res))
        .catch(sendError)
})
router.get('/customers/authenticated', (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const publicKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key.pub')) // get public key
    if (token != null) {
        jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
            if (!err && decoded.role === 'customer')
                return res.status(200).json({ message: 'Valid token' })
            else return res.status(401).json({ message: 'Invalid token' })
        })
    } else return res.status(401).json({ message: 'Invalid token' })
})
router.get('/staff/authenticated', (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const publicKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key.pub')) // get public key
    if (token != null) {
        jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, decoded) => {
            // TODO - separare i db di manager ed admin?
            if (!err && decoded.role === 'manager')
                return res.status(200).json({ message: 'Valid token' })
            else return res.status(401).json({ message: 'Invalid token' })
        })
    } else return res.status(401).json({ message: 'Invalid token' })
})

router.get('/publicKey', (req, res) => {
    const publicKey = fs.readFileSync(path.join(keysPath, 'jwtRS256.key.pub')) // get public key
    return res.status(200).json({ publicKey: publicKey.toString() })
})

module.exports = router
module.exports.verifyToken = verifyToken
module.exports.verifyLogin = verifyLogin
