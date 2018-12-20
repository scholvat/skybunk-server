const mongoose = require('mongoose');

require('../models/GoldenTicket');
const GoldenTicket = mongoose.model('GoldenTicket');

function generateGoldenTickets(){
  return new Promise((resolve, reject) =>{
    mongoose.connect('mongodb://localhost/grapp-dev');
    var promises = [];
    var tickets = [];
    for (let i = 0; i < 150; i++) {
      const ticketNumber = new GoldenTicket({
        ticketNumber: Math.random().toString(36).substring(2)
      });
      promises.push(ticketNumber.save());
      tickets.push(ticketNumber.ticketNumber)
    } 

    Promise.all(promises).then(results => {
      console.log("Successfully generated golden tickets")
      //mongoose.disconnect();
      resolve(tickets);
    });
  });
}
/*generateGoldenTickets().then(tickets =>{
  console.log(tickets)
})*/

  module.exports.generateGoldenTickets = generateGoldenTickets