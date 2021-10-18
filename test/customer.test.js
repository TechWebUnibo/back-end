import supertest from 'supertest'
import { expect } from 'chai'
import { createCustomer } from './helper'
import { deleteCustomer } from './helper'
const bcrypt = require('bcryptjs')

const uri = 'http://localhost:8000/api/'
const request = supertest(uri)

describe('Customers', () =>{
    let id = ''
    let token = ''
    let username = `Andrea-${Math.floor(Math.random() * 9999)}`
    const userData = {
        username: username,
        name: username.split('-')[0],
        surname: username.split('-')[1],
        password: 'andrea123',
        address: {
            city: "Bologna",
            zip: 40126,
            residence: 'via oberdan'
        }
    }


    it('POST customers/', () =>{
        
        const data = userData
        
        return request.post('customers/')
        .send(data)
        .then((res) => {
            let customer = res.body.customer
            expect(customer.username).to.eq(data.username)
            id = customer._id
            username = data.username
        })
        .catch((err) =>{
            console.log(err)
        })
    })

    it('LOGIN login/customers', () =>{
        const data = {
            username: username,
            password: 'andrea123'
        }
        return request.post(`auth/login/customers`).send(data)
        .then((res) =>{
            token = res.body.accessToken
            expect(res.body).to.not.be.empty
        })
    })

    it('MODIFY customers/:id', () =>{
        const data = {
            address: {
                city: "San Ferdinando",
                zip: 76017,
                residence: 'via salandra'
            }
        }

        return request.post(`customers/${id}`).set('Authorization', `Bearer ${token}`).send(data)
        .then((res) =>{
            let customer = res.body.customer
            expect(customer.address).to.deep.eq(userData.address)
        })
    })

    it('GET /customers/', () =>{
        return request.get('customers/')
        .then((res) => {
            expect(res.body).to.not.be.empty
        })
    })

    it('DELETE /customers/:id', () =>{
        return request.delete(`customers/${id}`).set('Authorization', `Bearer ${token}`)
        .then((res) => {
            expect(res.body).to.not.be.empty
        })
    })

})

describe('Negative test', ()=> {
    const password = 'andrea123'
    let customer

    before(async () => {
        customer = await createCustomer(password)
    });



    it('404 authentication failed login/customers', async () =>{
        const loginData = {
            username: `Andrea-${Math.floor(Math.random() * 9999)}`,
            password: 'wrong password'
        }
        const res = await request.post('auth/login/customers').send(loginData)
        expect(res.statusCode).to.be.eq(404)
    })

    it('403 authentication failed login/customers', async () =>{
        const loginData = {
            username: customer.username,
            password: 'ppaapp'
        }
        const res = await request.post('auth/login/customers').send(loginData)
        expect(res.statusCode).to.be.eq(403)
    })

    after(async () => {
        await deleteCustomer(customer, password)
    });
})
