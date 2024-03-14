const Driver = require('./driver')
const Sender = require('./sender')
const Order = require('./order')


class OrderingApp {
    constructor() {
        this.orders = [];
        this.senders = [];
        this.drivers = [];
        this.socketUserMap = new Map();
    }

    joinSession(socket){
        const {id, name, user_type} = socket.handshake.query
        if (user_type == 'driver'){
            const driver = this.drivers.find(driver => driver.id === id)
            if (driver){
                this.assignSocket({socket, user: driver})
                return
            }else{
                this.createUser({name, socket, user_type})
            }
        }else if(user_type == 'sender'){
            const sender = this.senders.find(sender => sender.id === id)
            if (sender){
                this.assignSocket({socket, user: sender})
                return
            }else{
                this.createUser({name, socket, user_type})
            }
        }
    }

    assignSocket({socket, user}){
        console.log(`Assigning socket to user ${user.name} => ${socket.id}`);
        this.socketUserMap.set(user.id, socket)
    }

    sendEvent({socket, eventname, data}){
        socket.emit(eventname, data)
    }

    createUser({name, socket, user_type}){
        switch (user_type){
            case 'driver':
                const driver = new Driver(name)
                this.drivers.push(driver)
                this.assignSocket({socket, user: driver})
                this.sendEvent({socket, eventname: 'driverCreated', data: {driver}})
                console.log(`DriverCreated: ${JSON.stringify(driver)}`);
                console.log(`Drivers: ${JSON.stringify(this.drivers)}`);
                return driver

            case 'sender':
                const sender = new Sender(name)
                this.senders.push(sender)
                this.assignSocket({socket, user: sender})
                this.sendEvent({socket, eventname: 'senderCreated', data: {sender}})
                console.log(`senderCreated: ${JSON.stringify(sender)}`);
                console.log(`Senders: ${JSON.stringify(this.senders)}`);
                return sender

            default:
                throw new Error ('Invalid User Type')
        }
    }

    requestOrder({current_location, destination, price, id}){
        console.log(`Requesting Order`);
        const sender = this.senders.find(sender => sender.id === id)
        console.log(`sender: ${sender}`);
        const order = new Order({current_location, destination, price, sender})
        this.orders.push(order)

        for (const driver of this.drivers){
            if (driver.in_ride) continue
            this.sendEvent({socket: this.socketUserMap.get(driver.id), eventname: 'orderRequested', data: {order}})
        }

        // Order should expire after 1min of request
        setTimeout(()=> {
            if (order.status == 'pending'){
                for (const driver of this.drivers){
                    
                    // Send event to remove notification from the driver
                    this.sendEvent({socket: this.socketUserMap.get(driver.id), eventname: 'driverNotFound', data: {order}})

                }

                // Send event to notify the sender that no driver was found
                console.log(this.socketUserMap.keys());
                this.sendEvent({socket: this.socketUserMap.get(sender.id), eventname: 'driverNotFound', data: {order}})
            }
        }, (1000 * 30))
        console.log(`Order Requested: ${JSON.stringify(order)}`);
        return order
    }

    acceptOrder(data){
        const {id, driverId} = data;
        const order = this.orders.find(order => order.id === id)
        const driver = this.drivers.find(driver => driver.id === driverId)
        const sender = this.senders.find(sender => sender.id === order.sender.id)

        order.assignDriver(driver)
        driver.inRide()
        // feedback event to the sender who requested
        this.sendEvent({socket: this.socketUserMap.get(sender.id), eventname: 'orderAccepted', data: {order}})

        // Feedback event  to the driver who accepted
        console.log(`driverId: ${driverId}`);
        this.sendEvent({socket: this.socketUserMap.get(driverId), eventname: 'orderAccepted', data: {order}})

        // Broadcasting to order drivers that didn't accept an order
        this.socketUserMap.get(driverId).broadcast.emit('didNotAccept', {order})
    }

    rejectOrder(data){
        const {id, driverId} = data;
        const order = this.orders.find(order => order.id === id)
        const driver = this.drivers.find(driver => driver.id === driverId)
        const sender = this.senders.find(sender => sender.id === order.sender.id)

        // Reject Order
        order.rejected()

        // feedback event to the sender who requested
        this.sendEvent({socket: this.socketUserMap.get(sender.id), eventname: 'orderRejected', data: {order}})

        console.log('Order rejected');
        // Feedback event  to the driver who accepted
        this.sendEvent({socket: this.socketUserMap.get(driverId), eventname: 'orderRejected', data: {order}})
    }

    finishRide(data){
        const {id, driverId} = data;
        const driver = this.drivers.find(driver => driver.id === driverId)
        const order = this.orders.find(order => order.id === id)
        const sender = this.senders.find(sender => sender.id === order.sender.id)

        driver.inRide()

        // Send Event to the sender
        this.sendEvent({socket: this.socketUserMap.get(sender.id), eventname: 'finishRide', data: {order}})

        // Send Event to the driver
        this.sendEvent({socket: this.socketUserMap.get(driverId), eventname: 'finishRide', data: {order}})
    }
}

module.exports = OrderingApp;
