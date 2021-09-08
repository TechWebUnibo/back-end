import supertest from 'supertest'
import { expect } from 'chai'
import { createCustomer, createRent, deleteRent, loginStaff, getProducts, getAvailable, createItem, deleteItem } from './helper'
import { deleteCustomer } from './helper'
const bcrypt = require('bcryptjs')

const uri = 'http://localhost:8000/api/'
const request = supertest(uri)

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}

let token

before(async() => {
    token = await loginStaff()
});


describe('Rentals', () => {

    it('Create a rent and start it', async () => {
        const start = new Date().toISOString().split('T')[0]
        const end = addDays(start, 5)
        let products = await getProducts()
        let item = await createItem(products[0]._id, token)
        
        const rental = await createRent(start, end, token)
        const res = await request.post(`rentals/${rental._id}/start`).set('Authorization', `Bearer ${token}`).send()
        deleteRent(rental._id, token)
        deleteItem(item._id, token)
        expect(res.status).to.be.eq(200)
    });

    it('Create a rent and terminate it', async () => {
        const end = new Date().toISOString().split('T')[0]
        const start = addDays(end, -5)
        let products = await getProducts()
        let item = await createItem(products[0]._id, token)
        const rental = await createRent(start, end, token)
        
        await request.post(`rentals/${rental._id}/start`).set('Authorization', `Bearer ${token}`).send()
        let returnItem = {}
        for(const item of rental.products){
            returnItem[item] = {
                condition: 'good',
                start: end,
                end: addDays(end, 4)
            }
        }
        const res = await request.post(`rentals/${rental._id}/terminate`).set('Authorization', `Bearer ${token}`)
        .send({products :returnItem, notes: 'All the products in good state'})
        deleteRent(rental._id, token)
        deleteItem(item._id, token)

        expect(res.body.products).to.have.all.keys(Object.keys(returnItem))
    });

    it('Modify a rent', async () => {
        const start = new Date().toISOString().split('T')[0]
        const end = addDays(start, 5)
        let products = await getProducts()
        let item = await createItem(products[0]._id, token)
        const rental = await createRent(start, end, token)
        let available = await getAvailable(products[0]._id, start, addDays(end, 1), token, rental._id)

        const data = {
            end: addDays(end, 1),
            price: available.price
        }


        const result = await request.post(`rentals/${rental._id}`).set('Authorization', `Bearer ${token}`).send(data)
        deleteRent(rental._id, token)
        deleteItem(item._id, token)
        expect(result.status).to.be.eq(200)
    });
});

describe('Negative test', async () => {
    it('Create a rent in the past and try to start it', async () => {
        const start = new Date('2000-01-01').toISOString().split('T')[0]
        const end = addDays(start, 5) 
        let products = await getProducts()
        let item = await createItem(products[0]._id, token)
        const rental = await createRent(start, end, token)
        const res = await request.post(`rentals/${rental._id}/start`).set('Authorization', `Bearer ${token}`).send()
        deleteRent(rental._id, token)
        deleteItem(item._id, token)
        expect(res.status).to.be.eq(400)
    });

    it('Modify a rent but item are occupied', async () => {
        const start = new Date().toISOString().split('T')[0]
        const end = addDays(start, 5)
        let products = await getProducts()
        let item = await createItem(products[0]._id, token)
        const rental1 = await createRent(start, end, token)
        const rental2 = await createRent(addDays(end, 1), addDays(end, 2), token)
        let available = await getAvailable(products[0]._id, start, addDays(end, 1), token, rental1._id)

        const data = {
            end: addDays(end, 1),
            price: available.price
        }


        const result = await request.post(`rentals/${rental1._id}`).set('Authorization', `Bearer ${token}`).send(data)
        deleteRent(rental1._id, token)
        deleteRent(rental2._id, token)
        deleteItem(item._id, token)
        expect(result.status).to.be.eq(400)
    });
});

