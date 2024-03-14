const express = require('express')
const {Server} = require('socket.io')
const {createServer} = require('http')
const path = require('path')

const OrderingApp = require('./orderapp')



// Initialize socket.io with express
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// Express Middleware
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))


const orderingApp = new OrderingApp()

io.on('connection', (socket) => {
    // When a user connects
    console.log(`< -------------------- >`);
    console.log(`A user: ${socket.id} has logged in`);
    orderingApp.joinSession(socket)

    // When a user requests order
    socket.on('requestOrder', (order) => {
        orderingApp.requestOrder(order)
    })

    socket.on('acceptOrder', (data) => {
        orderingApp.acceptOrder(data)
    })

    socket.on('rejectOrder', (data) => {
        orderingApp.rejectOrder(data)
    })

    socket.on('finishRide', (data) => {
        orderingApp.finishRide(data)
    })

    // When socket is disconnected
    socket.on('disconnect', (message) => {
        console.log(`\nSocket ${socket.id} disconnected due to ${message}`);
    })


})


// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html')
})

app.get('/signup', (req, res) => {
    res.sendFile('signup.html', {root: 'src/public'})
})

app.get('/driver', (req, res) => {
    res.sendFile('driver.html', {root: 'src/public'})
})

app.get('/sender', (req, res) => {
    const body = req.body
    console.log(body);
    res.sendFile('sender.html', {root: 'src/public'})
})


// Server Listen
const port = 4000
server.listen(port, ()=> {
    console.log(`Server running on port: ${port}`);
})