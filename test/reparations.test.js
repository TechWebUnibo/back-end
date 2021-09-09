import supertest from 'supertest'
import { expect } from 'chai'
import { getReparations, loginStaff, getProducts, getAvailable, createItem, deleteItem, createGenericItem, modifyItem } from './helper'
import { deleteCustomer } from './helper'

let token
before(async () => {
    token = await loginStaff()
});

describe('Reparation Test', () => {
    it('Terminate reparation', async () => {
        const start = new Date().toISOString().split('T')[0]
        const end = start

        let item = await createGenericItem(token)
        item = await modifyItem(item._id, {condition: 'broken', start: start, end: end }, token)
        await new Promise(r => setTimeout(r, 7000));
        const rep = await getReparations(item._id, token)
        deleteItem(item._id, token)
        expect(rep[0].products).to.contain(item._id)
        expect(item.condition).to.be.eq('perfect')
        expect(rep[0].terminated).to.be.eq(true)
    }); 
});