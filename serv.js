const express = require("express");
const session = require('express-session');
const bp = require('body-parser')
const app = express();
const fs = require("fs");
const port = 8888;
const https = require("https");
var options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
};
const server = https.createServer(options, app);
const io = require("socket.io")(server);
const bcrypt = require("bcrypt");
const mysql = require('mysql');
const sanitizer = require('sanitize')();

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
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

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

app.post("/login", (req, res) => {
    var user = req.body.account;
    if (user === "" || req.body.pwd === "") {
        return res.send('Not allowing empty input!!');
    }

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
            conn.end();
        }
        else {
            if (results.length > 0) {
                const comparison = bcrypt.compareSync(req.body.pwd, results[0].password)
                if (comparison) {
                    console.log(`Account ${user} login.`);
                    req.session.name = results[0].username;
                    res.send('ok');
                    conn.end();
                }
                else {
                    console.log(`User ${user} key in wrong password.`)
                    res.send('Wrong password!');
                    conn.end();
                }
            }
            else {
                res.send('Account not found.');
                conn.end();
            }
        }
    });
});
app.post("/register", (req, res) => {
    var input_test;
    var username = req.body.name;
    input_test = username.replace(/([^0-9A-z\u4e00-\u9fa5\u3105-\u3129]|[\^\_])/g,'');
    if (input_test !== username) {
        console.log('username hacking detected.');
        console.log(input_test)
        return res.send('Hacking detected.');
    }
    var mail = req.body.mail;
    input_test = mail.replace(/[^a-zA-Z0-9._%@+-]/g,'');
    if (input_test !== mail) {
        console.log('mail hacking detected.');
        console.log(input_test)
        return res.send('Hacking detected.');
    }
    var account = req.body.account;
    input_test = account.replace(/[^a-zA-Z0-9]/g,'');
    if (input_test !== account) {
        console.log('account hacking detected.');
        console.log(input_test)
        return res.send('Hacking detected.');
    }
    var pwd = req.body.pwd;
    /*input_test = pwd.replace(/([^0-9A-z\u4e00-\u9fa5\u3105-\u3129]|[\^\_])/g,'');
    if (input_test !== pwd) {
        console.log('Hacking detected.');
        return res.send('Hacking detected.');
    }*/
    var new_user = {
        "username": username,
        "mail": mail,
        "account": account,
        "password": bcrypt.hashSync(pwd, 10)
    };
    if (username === "" || mail === "" || account === "" || req.body.pwd === "") {
        return res.send('Not allowing empty input!!');
    }

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
    // res.redirect('/home.html');
    res.end();
})

io.sockets.on("connection", socket => {
    var address = socket.handshake.address;
    console.log(`New client page from ${address}, id=${socket.id}`);

    socket.on("log", (text) => {
        console.log(`console log form ${socket.id}: ${text}`);
    })
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
