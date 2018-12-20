var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../app');

var expect = chai.expect;

chai.use(chaiHttp);

//Generate golden tickets
//create user
//Login user
//create Channel
//
//fully test user controller
//fully test post controller
//fully test channel controller
//notification controller?
describe('Intialize environment', function() {
    //Init and clear database

    var MongoClient = require('mongodb').MongoClient
    MongoClient.connect('mongodb://localhost/grapp-dev', function(err, db){
        if(err) throw err;
        db.dropDatabase(function(err, result){
            console.log("Error : "+err);
            if (err) throw err;
            console.log("Operation Success ? "+result);
            // after all the operations with db, close it.
            db.close();
        });
    });

    var tickets;
    it('Generate golden tickets', function(done) {
        generateGoldenTickets = require('../helpers/generateGoldenTickets').generateGoldenTickets
        generateGoldenTickets().then(_tickets => {
            tickets = _tickets;
            expect(tickets).to.have.lengthOf.at.least(1);
            done();
        });
    });
    

    const username = "user"
    const password = "pass"
    const firstName = "Mary"
    const lastName = "Brubaker-Zehr"
    it('Create user', function(done) {
        chai.request(app)
        .post('/users')
        .send({
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName,
            goldenTicket: tickets[0],
          })
        .end(function(err, res) {
            expect(res).to.have.status(200);
            done();
        })
    });

    var authToken;
    it('Login user', function(done) {
        chai.request(app)
        .post('/users/login')
        .send({
            username: username,
            password: password,
          })
        .end(function(err, res) {
            authToken = res.body.token;
            expect(res).to.have.status(200);
            done();
        })
    });
    it('Create channel', function(done) {
        chai.request(app)
        .post('/channels')
        .set({ 'Authorization': 'Bearer ' + authToken })
        .send({
            name: "testing",
            tags: "what?",
            description: "descriptiuos"
          })
        .end(function(err, res) {
            expect(res).to.have.status(200);
            done();
        })
    });
});