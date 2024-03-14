class Order{
    constructor({current_location, destination, price, sender}){
        this.id = Math.floor(Math.random() * 10000).toString()
        this.current_location = current_location
        this.destination = destination
        this.price = price
        this.sender = sender
        this.status = 'pending'
        this.driver = null
    }

    assignDriver(driver){
        this.driver = driver
        this.status = 'accepted'
    }

    rejected(){
        this.status = 'rejected'
    }
}



module.exports = Order

