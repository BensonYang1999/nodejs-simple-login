const express = require("express");
const session = require('express-session');
const app = express();
const port = 8888;
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
const bcrypt = require("bcrypt");
// const fs = require("fs");
const mysql = require('mysql');

function createConnection() {
    var conn = mysql.createConnection({
        host: 'localhost',
        user: 'node',
        password: 'nodejsnodejs',
        database: 'nodejs',
        port: 3306
    });
    return conn;
};
var conn;

// read user data
/*var customers;
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
});*/

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

    /*var ret = false;
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
        res.send('Account not found.');*/

    // console.log(`attemp to login with ${user}`);
    // req.session.name = user;
    // res.send('ok');
    conn = createConnection();
    conn.connect();
    conn.query('SELECT * FROM users where account = \'' + user + '\'', async function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send('Error occur.');
        }
        else {
            if (results.length > 0) {
                const comparison = bcrypt.compareSync(req.query.pwd, results[0].password)
                if (comparison) {
                    console.log(`User ${user} login.`);
                    req.session.name = user;
                    res.send('ok');
                } else {
                    console.log(`User ${user} key in wrong password.`)
                    res.send('Wrong password!');
                }
            }
            else {
                res.send('Account not found.');
            }
        }
    });
    conn.end();
});
app.get("/register", (req, res) => {
    var username = req.query.name;
    var mail = req.query.mail;
    var account = req.query.account;
    var pwd = bcrypt.hashSync(req.query.pwd, 10);
    var new_user = {
        "username": username,
        "mail": mail,
        "account": account,
        "password": pwd
    };

    /*// json version
    // duplicated account
    var dup = false;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].account == account) {
            // res.send("")
            dup = true;
            break;
        }
    }
    if (dup) {
        res.send('duplicated account name')
    }
    else {
        var new_user = {
            "username": username,
            "mail": mail,
            "account": account,
            "password": pwd
        };

        customers.push(new_user);
        fs.writeFile("./userdata.json", JSON.stringify(customers), function (err) {
            if (err) throw err;
            console.log(`User ${account} register successful.`);
        });

        res.send('ok');
    }*/


    // mysql version
    conn = createConnection();
    conn.connect();
    conn.query('SELECT * FROM users where account = \'' + account + '\'', async function (error, results, fields) {
        if (error) {
            console.log(error);
            res.send('Error occur.');
            conn.end();
        }
        else {
            if (results.length > 0) {
                res.send('duplicated account name');
                conn.end();
            }
            else {
                conn.query('INSERT INTO users SET ?', new_user, function (error, results, fields) {
                    if (error) {
                        console.log(error)
                        res.send('Error occur.');
                        conn.end();
                    }
                    else {
                        console.log("user added to database sucessfully.")
                        res.send('ok');
                        conn.end();
                    }
                });
            }
        }
    });
    
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