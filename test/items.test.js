import supertest from 'supertest'
import { expect } from 'chai'
import { createCustomer, createRent, deleteRent, loginStaff, getProducts, getAvailable, createItem, deleteItem, searchRent } from './helper'
const bcrypt = require('bcryptjs')

const uri = 'http://localhost:8000/api/'
const request = supertest(uri)

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}

let token

before(async () => {
    token = await loginStaff()
});


describe('Items', () => {
    it('Create an item and make it unavailable (no substitude)', async () => {
        const start = addDays(new Date().toISOString().split('T')[0], 4)
        const end = addDays(start, 5)
        const products = await getProducts()
        const item1 = await createItem(products[0]._id, token)
        let rental = await createRent(start, end, token)

        const data = {
            condition: 'not available'
        }

        const res = await request.post(`items/${item1._id}`).set('Authorization', `Bearer ${token}`).send(data)
        await new Promise(r => setTimeout(r, 1000));
        rental = await searchRent(rental._id, token)
        await deleteRent(rental._id, token)
        await deleteItem(item1._id, token)
        expect(res.status).to.be.eq(200)
        expect(rental.state).to.be.eq('cancelled')
    });

    it('Create an item and make it unavailable (with substitude)', async () => {
        const start = addDays(new Date().toISOString().split('T')[0], 4)
        const end = addDays(start, 5)
        const products = await getProducts()
        const item1 = await createItem(products[0]._id, token)
        let rental = await createRent(start, end, token)
        const item2 = await createItem(products[0]._id, token)

        const data = {
            condition: 'not available'
        }

        const res = await request.post(`items/${item1._id}`).set('Authorization', `Bearer ${token}`).send(data)
        await new Promise(r => setTimeout(r, 1000));
        rental = await searchRent(rental._id, token)
        await deleteRent(rental._id, token)
        await deleteItem(item1._id, token)
        await deleteItem(item2._id, token)
        expect(res.status).to.be.eq(200)
        expect(rental.products).to.contain(item2._id)
    });
})