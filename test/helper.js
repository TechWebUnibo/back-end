import { expect } from 'chai'
import supertest from 'supertest'

const uri = 'http://localhost:8000/api/'
const request = supertest(uri)

export const createCustomer = async (password) => {
    let username = `Andrea-${Math.floor(Math.random() * 9999)}`
    const data =  {
        username: username,
        name: username.split('-')[0],
        surname: username.split('-')[1],
        password: password,
        address: {
            city: "Bologna",
            zip: 40126,
            residence: 'via oberdan'
        }
    }

    const res = await request.post('customers/').send(data)
    return res.body.customer
}


export const delay = async (time) =>{
    return await new Promise(r => setTimeout(r, time))
}

export const loginCustomer = async (customer, password) => {
    const res = await request.post('auth/login/customers').send({username: customer.username, password: password})
    return res.body.accessToken
}

export const deleteCustomer = async (customer, password) => {

    const token = await loginCustomer(customer, password)
    const res = await request.delete(`customers/${customer._id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const loginStaff = async () =>{
    // Account used for testing
    const admin = {
        username: 'Vitangelo Moscarda',
        password: 'antonio123'
    }
    const res = await request.post('auth/login/staff').send({ username: admin.username, password: admin.password })
    return res.body.accessToken
}

export const getCustomers = async ()=>{
    const res = await request.get('customers/').send()
    return res.body
}

export const getStaff = async ()=>{
    const res = await request.get('staff/').send()
    return res.body
}

export const getProducts = async () =>{
    const res = await request.get('products/').send()
    return res.body
}

export const getAvailable = async (id, start, end, token, rent) =>{
    const res = await request.get(`products/${id}/available?start=${start}&end=${end}${rent ? '&rent='+rent : ''}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const createRent = async (start, end, token) =>{
    let customers = await getCustomers()
    let id = customers[0]._id

    let staff = await getStaff()
    // TODO - da sistemare
    let products = await getProducts()
    let available = await getAvailable(products[0]._id, start, end, token)

    const data = {
        products: available.products,
        customer: id,
        //employee: staff[0]._id,
        productType: products[0]._id,
        start: start,
        end: end,
        price: available.price
    }
    const res = await request.post(`rentals/`).set('Authorization', `Bearer ${token}`).send(data)
    return res.body.rent
}

export const startRent = async(id, token) => {
    const res = await request.post(`rentals/${id}/start`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const terminateRent = async(rental, token) => {
    let returnItem = {}
    for (const item of rental.products) {
        returnItem[item] = {
            condition: 'perfect',
        }
    }
    const res = await request.post(`rentals/${rental._id}/terminate`).set('Authorization', `Bearer ${token}`)
    .send({ products: returnItem, notes: 'All the products in good state' })
    return res.body
}

export const searchRent = async (id, token) =>{
    const res = await request.get(`rentals/${id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const deleteRent = async (id, token) =>{
    const res = await request.delete(`rentals/${id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const createGenericItem = async (token) => {
    const products = await getProducts()
    return await createItem(products[0]._id, token)
}

export const createItem = async (id, token) => {
    const data = {
        name: `Generic Item-${Math.floor(Math.random() * 999)}`,
        price: 20,
        type: id,
        condition: 'perfect',
    }
    const res = await request.post(`items/`).set('Authorization', `Bearer ${token}`).send(data)
    return res.body.item
}

export const modifyItem = async (id, data, token) => {
    const res = await request.post(`items/${id}`).set('Authorization', `Bearer ${token}`).send(data)
    return res.body.item
}

export const deleteItem = async (id, token) => {
    const res = await request.delete(`items/${id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const getReparations = async (id, token) => {
    const res = await request.get(`reparations/?products=${id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}

export const getNotifications = async (id, token) => {
    const res = await request.get(`notifications/customers/${id}`).set('Authorization', `Bearer ${token}`).send()
    return res.body
}