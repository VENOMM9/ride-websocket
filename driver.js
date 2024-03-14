class Driver{
    constructor(name){
        this.id = Math.floor(Math.random() * 10000).toString()
        this.name = name
        this.in_ride = false
    }

    acceptOrder(order){
        console.log(`${this.name} accepts order ${order.id}`);
        order.assignDriver(this)
    }

    rejectOrder(order){
        console.log(`${this.name} rejects order ${order.id}`);
    }

    inRide(){
        this.in_ride ? this.in_ride = false : this.in_ride = true
        console.log(`in_ride ${this.in_ride}`);
    }
}

module.exports = Driver