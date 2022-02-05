const express = require("express");
const session = require('express-session');
const app = express();
const port = 8888;
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
const bcrypt = require("bcrypt");
const fs = require("fs");
var customers;

// read user data
fs.readFile("./userdata.json", "utf8", (err, jsonString) => {
    if (err) {
        console.log("Error reading file from disk:", err);
        return;
    }
    try {
        customers = JSON.parse(jsonString);
    } catch (err) {
        console.log("Error parsing JSON string:", err);
    }
});

app.use(session({
    secret: 'key',
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 600 * 1000 } // ms
}));

app.get("/", (req, res) => {
    res.redirect('/home.html');
});
app.get("/content.html", (req, res, next) => {
    if (req.session.name === undefined) {
        res.redirect("/home.html")
    }
    else {
        // console.log(`login with ${req.session.name}`);
        next();
    }

});

app.use(express.static(__dirname + "/public"));

app.get("/login", (req, res) => {
    var user = req.query.account;

    var ret = false;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].account == user) {
            ret = true;
            if (bcrypt.compareSync(req.query.pwd, customers[i].password)) {
                console.log(`User ${user} login.`);
                req.session.name = user;
                res.send('ok');
            }
            else {
                console.log(`User ${user} key in wrong password.`)
                res.send('Wrong password!');
            }
            break;
        }
    }
    if (!ret)
        res.send('Account not found.');

    // console.log(`attemp to login with ${user}`);
    // req.session.name = user;
    // res.send('ok');
});
app.get("/register", (req, res) => {
    var username = req.query.name;
    var mail = req.query.mail;
    var account = req.query.account;
    var pwd = bcrypt.hashSync(req.query.pwd, 10);
    var dup = false;

    // duplicated account
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].account == account) {
            res.send("")
            dup = true;
            break;
        }
    }
    if (dup) {
        res.send('duplicated account name')
    }
    else {
        customers.push({
            "username": username,
            "mail": mail,
            "account": account,
            "password": pwd
        })
        fs.writeFile("./userdata.json", JSON.stringify(customers), function (err) {
            if (err) throw err;
            console.log(`User ${account} register successful.`);
        });
        res.send('ok');
    }



});
app.get("/username", (req, res) => {
    res.send(req.session.name);
});
app.get('/logout', (req, res) => {
    console.log(`User ${req.session.name} logout.`)
    req.session.destroy();
    res.redirect('/home.html');
})

io.sockets.on("connection", socket => {
    var address = socket.handshake.address;
    console.log(`New client page from ${address}, id=${socket.id}`);

    socket.on("log", (text) => {
        console.log(`console log form ${socket.id}: ${text}`);
    })
});

server.listen(port, () => console.log(`Server is running on port ${port}`));