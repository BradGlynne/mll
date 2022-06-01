const jsonBuilder = require("./jsonBuilder");
const customJsonBuilder = require("./customJsonBuilder");
const moment = require('moment');
require('dotenv').config({ path: __dirname + '/.env' })
// process.env.NODE_ENV = 'production';


const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');


const eol = require('eol');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const request = require('request');
const app = express();
const bodyParser = require('body-parser')
const fs = require("fs");
const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator')
const passport = require('passport');
var EveOAuth2Strategy = require('passport-eve-oauth2').Strategy;
var randomstring = require("randomstring");

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: randomstring.generate(8)
}));

app.use(cookieParser());


const trackingCorp = "98656381";
var toTrack;
var cronID;
var userContracts;
var id_cache = {};
var statistics = {
    outstanding: 0,
    time: 0
};


var sessions = []; //store login sessions


//delete all sessions every hour

setInterval(() => {
    sessions = []
}, 3600000);

passport.use(new EveOAuth2Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: "publicData esi-mail.send_mail.v1 esi-universe.read_structures.v1 esi-contracts.read_corporation_contracts.v1",
    callbackURL: process.env.CALLBACK_URI,
    state: "secret"
},
    function (accessToken, refreshToken, profile, cb) {

        return cb(null, {
            'accessToken': accessToken,
            'refreshToken': refreshToken,
            'profile': profile
        });
    }
));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

const systems = require("./systems.js");
const { resolve } = require('path');
const { options } = require('request');

const db = mongoose.createConnection(process.env.DB_HOST);

const appraisalSchema = mongoose.Schema({
    key: String,
    from: String,
    to: String,
    service: String,
    volume: Number,
    reward: Number,
    collateral: Number,
    jumps: Number
});


const customSchema = mongoose.Schema({
    key: String,
    from: String,
    to: String,
    isRush: Boolean,
    volume: Number,
    collateral: Number,
    eveCharacterName: String,
    discordId: String,
    structureType: Boolean,
    rushTargetDate: Date,
    submittedDate: Date,
    discordNotified: {
        type: Boolean,
        required: true,
        default: false
    }
});

const systemSchema = mongoose.Schema({
    name: String,
    id: String,
    security: String
});

const serviceSchema = mongoose.Schema({
    name: String,
    highsecPrice: Number,
    lowsecPrice: Number,
    nullsecPrice: Number,
    maxVolume: Number,
    maxCollateral: Number,
    runsIn: {
        highsec: Boolean,
        lowsec: Boolean,
        nullsec: Boolean
    },
    isRush: {
        type: Boolean,
        default: false
    },
    rushMultiplier: {
        type: Number,
        default: 0
    },
    minRushPrice: {
        type: Number,
        default: 0
    }
});

const routeSchema = mongoose.Schema({
    start: String,
    destination: String,
    minReward: Number,
    maxVolume: Number,
    maxCollateral: Number,
    flatPrice: Number,
    price: Number,
    rushShippingCharge: Number,
    collateralMultiplier: String,
    isRush: {
        type: Boolean,
        default: false
    },
    isFlat: Boolean,
    routeType: String
});

const characterSchema = mongoose.Schema({
    characterID: String,
    refreshToken: String,
    accessToken: String,
    tracking: Boolean
});

const contractSchema = mongoose.Schema({
    date: Date,
    dateCompleted: Date,
    type: String,
    key: String,
    contractID: {
        type: String,
        required: true,
        unique: true
    },
    status: String,
    issuerID: String,
    issuerName: String,
    start: String,
    end: String,
    volume: Number,
    reward: Number,
    collateral: Number,
    description: {
        type: String,
        required: true,
        default: ""
    },
    secondaryValidationReward: Number,
    service: String,
    acceptorId: String,
    acceptorName: String,
    appraisalCollateral: Number,
    appraisalReward: Number,
    appraisalVolume: Number,
    appraisalService: String,
    appraisalFrom: String,
    appraisalTo: String,
    appraisalJumps: Number,
    mailed: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveryAcknowledged: {
        type: Boolean,
        required: true,
        default: false
    },
    validationStatus: String,
    discordNotified: {
        type: Boolean,
        required: true,
        default: false
    },
    discordNotificationTime: Date,
    discordReminderSent: {
        type: Boolean,
        required: true,
        default: false
    },
    rushContractExpired: {
        type: Boolean,
        required: true,
        default: false
    }
});

const haulerSchema = mongoose.Schema({
    ingame_name: String,
    username: String,
    password: String
});

const settingsSchema = mongoose.Schema({
    mailsEnabled: {
        type: Boolean,
        required: true,
        default: false
    },
    discordEnabled: {
        type: Boolean,
        required: true,
        default: false
    },
    customDiscordEnabled: {
      type: Boolean,
      required: true,
      default: false
    }
});

contractSchema.plugin(uniqueValidator);

const Appraisal = db.model("Appraisal", appraisalSchema);
const Custom = db.model("Custom", customSchema);
const System = db.model("System", systemSchema);
const Service = db.model("Service", serviceSchema);
const Routes = db.model("Route", routeSchema);
const Characters = db.model("Character", characterSchema);
const Contracts = db.model("Contract", contractSchema);
const Haulers = db.model("Hauler", haulerSchema);
const Settings = db.model("Setting", settingsSchema);

const systemsData = JSON.parse(fs.readFileSync(__dirname + "/data/systems.json"));


app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.listen(process.env.PORT || 80, err => {
    if (err) {
        console.error(err);
    }
    else {
        console.log("Server online");
    }
});

//AUTH MIDDLEWARE

function authAdmin(req, res, next) {
    const key = req.cookies.key;
    const ip = req.ip;
    for (_session of sessions) {
        if (_session.key == key && _session.type == "admin") {
            next();
            return;
        }
    }
    res.redirect("/admin/login");
}

function authHauler(req, res, next) {
    const key = req.cookies.key;
    const ip = req.ip;
    for (_session of sessions) {
        if (_session.key == key && (_session.type == "admin" || _session.type == "hauler")) {
            next();
            return;
        }
    }
    res.redirect("/hauler/login");
}


//AUTH MIDDLEWARE



//app.get("/perjumpcalculator", authAdmin, (req, res) => {
//    let systemPromise = System.find({}).exec();
//    let servicesPromise = Services.find({}).exec();
//    Promise.all([systemPromise, routePromise, haulerPromise, settingsPromise]).then((data) => {
//        res.render("admin.ejs", { systems: data[0], routes: data[1], haulers: data[2], settings: data[3] });
//    });
//});



app.get("/perjumpcalculator", (req, res) => {
    System.find({}, (err, systems) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            res.render("index.ejs", { systems: systems });
        }
    })
});



app.get("/custom", (req, res) => {
    System.find({}, (err, systems) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            res.render("custom.ejs", { systems: systems });
        }
    })
});



app.get("/jfcalculator", (req, res) => {
    let otherRoutePromise = Routes.find({routeType: {$ne:"Standard"}}).sort({start: 1, destination: 1}).exec();
    let standardRoutePromise = Routes.find({routeType: "Standard"}).exec();
    Promise.all([standardRoutePromise, otherRoutePromise]).then((data) => {
        res.render("jf.ejs", { routes: data[0], otherRoutes: data[1]});
    });
});

// app.get("/jfcalculator", (req, res) => {
//     Routes.find({}, (err, routes) => {
//         if (err) {
//             res.sendStatus(500);
//         }
//         else {
//             res.render("pricing.ejs", { routes });
//         }
//     })
// });

app.get("/jfcalculator", (req, res) => {
    Routes.find({}, (err, routes) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            res.render("jf.ejs", { routes });
        }
    })
});

app.get("/", (req, res) => {
    res.render("homepage.ejs");
})


app.get("/admin/login", (req, res) => {
    res.render("login.ejs");
});


app.get("/hauler/login", (req, res) => {
    res.render("hauler-login.ejs");
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username == process.env.ADMIN_USERNAME && password == process.env.ADMIN_PASSWORD) {
        const key = randomstring.generate(8);
        const ip = req.ip;
        const type = "admin";
        const createdAt = new Date();
        sessions.push({ key, type, ip, createdAt });
        res.cookie("key", key, { expires: new Date(Date.now() + 900000) });
        res.redirect("/admin");
    }
    else {
        res.redirect("/admin/login");
    }
});

app.post("/hauler/login", (req, res) => {
    const { username, password } = req.body;
    Haulers.findOne({ username, password }, (err, hauler) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            if (hauler) {
                const key = randomstring.generate(8);
                const ip = req.ip;
                const type = "hauler"
                const createdAt = new Date();
                sessions.push({ key, type, ip, createdAt });
                res.cookie("key", key);
                res.redirect("/contracts");
            }
            else {
                res.sendStatus(403)
            }
        }
    })


});

app.get("/admin", authAdmin, (req, res) => {
    let systemPromise = System.find({}).exec();
    let routePromise = Routes.find({}).exec();
    let haulerPromise = Haulers.find({}).exec();
    let settingsPromise = Settings.findOne({}).exec();
    Promise.all([systemPromise, routePromise, haulerPromise, settingsPromise]).then((data) => {
        res.render("admin.ejs", { systems: data[0], routes: data[1], haulers: data[2], settings: data[3] });
    });
});

app.get("/system/search/:name", (req, res) => {
    const toSearch = req.params.name;
    let results = [];

    systemsData.forEach(system => {
        if (system.solarSystemName.toString().toLowerCase().includes(toSearch)) {
            results.push({ "id": system.solarSystemID, "name": system.solarSystemName, "security": Math.round(parseFloat(system.security) * 10) / 10 });
        }
    });

    res.send(results)
})

app.get("/services", authAdmin, (req, res) => {
    let servicePromise = Service.find({}).exec();
    Promise.all([servicePromise]).then((data) => {
        res.send(data[0]);
    });
});

app.post("/services/update", authAdmin, async (req, res) => {
    const data = req.body.services;
    //clear service db
    await Service.deleteMany({});
    //save new data
    for (service of data) {
        const toSave = new Service({
            name: service.name,
            highsecPrice: service.highsecPrice,
            lowsecPrice: service.lowsecPrice,
            nullsecPrice: service.nullsecPrice,
            maxVolume: service.maxVolume,
            maxCollateral: service.maxCollateral,
            runsIn: {
                highsec: service.runsInHighsec,
                lowsec: service.runsInLowsec,
                nullsec: service.runsInNullsec
            },
            isRush: service.isRush,
            rushMultiplier: service.rushMultiplier,
            minRushPrice: service.minRushPrice
        });
        await toSave.save();
    }
    res.sendStatus(200);

});

app.post("/routes/get/", async (req, res) => {
    const { id } = req.body;
    Routes.find({ _id: id }, (err, route) => {
        if (err) {
            res.send({ err });
        }
        else {
            res.send(route);
        }
    })
});

app.post("/routes/get/name/", async (req, res) => {
    const { id } = req.body;
    Routes.find({ start: id }, (err, route) => {
        if (err) {
            res.send({ err });
        }
        else {
            res.send(route);
        }
    })
});

app.post("/routes/add", authAdmin, async (req, res) => {
    const { routeType, startSystem, destinationSystem, minReward, maxJFVolume, maxJFCollateral, flatPrice, price, rushShippingCharge, collateralMultiplier, isFlat, isRush } = req.body;
    let isError = false;
    try {
        const newRoute = new Routes({
            routeType: routeType,
            start: startSystem,
            destination: destinationSystem,
            minReward: parseInt(minReward),
            maxVolume: parseInt(maxJFVolume),
            maxCollateral: parseInt(maxJFCollateral),
            flatPrice: parseInt(flatPrice),
            price: parseFloat(price),
            rushShippingCharge: parseInt(rushShippingCharge),
            collateralMultiplier: parseFloat(collateralMultiplier),
            isFlat,
            isRush
        });
        await newRoute.save();
    }
    catch (err) {
        isError = true;
        console.log(err);
        res.sendStatus(500);
    }

    if (!isError) {
        res.sendStatus(200);
    }
});

app.post("/routes/edit", authAdmin, async (req, res) => {
    const { id, routeType, startSystem, destinationSystem, minReward, maxJFVolume, maxJFCollateral, flatPrice, price, rushShippingCharge, collateralMultiplier, isFlat, isRush } = req.body;
    let isError = false;

    let editedRoute = {}
    editedRoute.routeType = routeType;
    editedRoute.start = startSystem;
    editedRoute.destination = destinationSystem;
    editedRoute.minReward = parseInt(minReward);
    editedRoute.maxVolume = parseInt(maxJFVolume);
    editedRoute.maxCollateral = parseInt(maxJFCollateral);
    editedRoute.flatPrice = parseInt(flatPrice);
    editedRoute.price = parseFloat(price);
    editedRoute.rushShippingCharge = parseInt(rushShippingCharge);
    editedRoute.collateralMultiplier = parseFloat(collateralMultiplier);
    editedRoute.isFlat = isFlat;
    editedRoute.isRush = isRush;

    Routes.findOneAndUpdate({ _id: id }, editedRoute, async (err, route) => {
        if (err) {
            res.send({ err });
        }
        else {
            res.sendStatus(200);
        }
    })


});

app.post("/routes/remove", authAdmin, async (req, res) => {
    const { id } = req.body;
    Routes.deleteOne({ _id: id }, (err) => {
        if (err) {
            res.send({ err });
        }
        else {
            res.sendStatus(200);
        }
    })
})


app.post("/routes/toggleRush", authAdmin, async (req, res) => {
    const { id } = req.body;
    Routes.findOne({ _id: id }, async (err, route) => {
        if (err) {
            res.send({ err });
        }
        else {
            if (route.isRush) {
                route.isRush = false;
            }
            else {
                route.isRush = true;
            }
            await route.save();
            res.sendStatus(200);
        }
    })
})

app.post("/haulers/add", authAdmin, async (req, res) => {
    const { ingame_name, username, password } = req.body;
    let isError = false;
    try {
        const newHauler = new Haulers({
            ingame_name, username, password
        });
        await newHauler.save();
    }
    catch (err) {
        isError = true;
        console.log(err);
        res.sendStatus(500);
    }

    if (!isError) {
        res.sendStatus(200);
    }
});

app.post("/haulers/remove", authAdmin, async (req, res) => {
    const { id } = req.body;
    Haulers.deleteOne({ _id: id }, (err) => {
        if (err) {
            res.send({ err });
        }
        else {
            res.sendStatus(200);
        }
    })
})

app.get("/settings/toggle/mail", authAdmin, async (req, res) => {
    let currentSettings = await Settings.findOne({}).exec();
    if (currentSettings.mailsEnabled) {
        await Settings.findOneAndUpdate({}, { mailsEnabled: false }).exec();
    }
    else {
        await Settings.findOneAndUpdate({}, { mailsEnabled: true }).exec();
    }
    res.sendStatus(200);
})


app.get("/settings/toggle/discord", authAdmin, async (req, res) => {
    let currentSettings = await Settings.findOne({}).exec();
    if (currentSettings.discordEnabled) {
        await Settings.findOneAndUpdate({}, { discordEnabled: false }).exec();
    }
    else {
        await Settings.findOneAndUpdate({}, { discordEnabled: true }).exec();
    }
    res.sendStatus(200);
})

app.get("/settings/toggle/customRequestDiscord", authAdmin, async (req, res) => {
    let currentSettings = await Settings.findOne({}).exec();
    if (currentSettings.customDiscordEnabled) {
        await Settings.findOneAndUpdate({}, { customDiscordEnabled: false }).exec();
    }
    else {
        await Settings.findOneAndUpdate({}, { customDiscordEnabled: true }).exec();
    }
    res.sendStatus(200);
})



app.get("/mail/:id/:action", async (req, res) => {
    const { id, action } = req.params;
    let toMail;
    if (action == "approve") {
        toMail = {
            "approved_cost": 0,
            "body": "\nYour contract has been approved. One of our haulers will be shipping it soon.\m\nMulti-Lemm-Logistics",
            "recipients": [
                {
                    "recipient_id": 2116460876,
                    "recipient_type": "character"
                }
            ],
            "subject": "Contract Approved"
        }
    }
    else if (action == "reject") {
        toMail = {
            "approved_cost": 0,
            "body": "\nYour contract has been rejected. Please recheck the reward and collateral.\n\nMulti-Lemm-Logistics",
            "recipients": [
                {
                    "recipient_id": 2116460876,
                    "recipient_type": "character"
                }
            ],
            "subject": "Contract Rejected"
        }
    }

    headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

    var options = {
        uri: 'https://esi.evetech.net/latest/characters/' + process.env.CHARACTER_ID + '/mail/?token=' + encodeURI(toTrack.accessToken),
        method: 'POST',
        json: toMail
    };

    request.post(options, async (err, response, body) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }

        else {
            await Contracts.findOneAndUpdate({ contractID: id }, { mailed: true, reason: action }).exec();
            console.log(body);
            res.redirect("/contracts");
            return;
        }

    });


})

app.post("/", async (req, res) => {
    let errorLines = "";


    //MAKE API REQUEST
    const response = await fetch('https://janice.e-351.com/api/rest/v2/appraisal?market=2&designation=appraisal&pricingVariant=immediate&persist=true&compactize=true&pricePercentage=1', {
        method: 'post',
        body: req.body.itemList,
        headers: { 'Content-Type': 'text/plain', "X-ApiKey": "07RzWN1u39rubweDFsk1p5SjnxTNlCdi", "accept": "application/json" }
    });
    const data = await response.json();
    let volume, price;
    try {
        volume = (Math.round((parseInt(data.totalPackagedVolume)  || 0) * 100) /100) + (parseInt(req.body.additionalVolume) || 0 );
        price = Math.round(data.effectivePrices.totalSellPrice);
        errorLines = data.failures;
    }
    catch (err) {
        res.send({ "err": "Invalid Input" });
        return;
    }
    const collateral = (parseInt(price) || 0) + (parseInt(req.body.additionalCollateral) || 0);;

    //get number of jumps
    const { source, destination } = req.body;
    const sourceName = await systems.getSystemName(source), destinationName = await systems.getSystemName(destination);
    const response1 = await fetch('https://esi.evetech.net/latest/route/' + source + '/' + destination + '/?datasource=tranquility&flag=shortest', {
        method: 'get',
    });
    const jumps = await response1.json();
    if (jumps.error) {
        res.send({ "err": "No Route Found" });
        return;
    }
    const jumpCount = jumps.length - 1;


    var highsecJumps = 0, lowsecJumps = 0, nullsecJumps = 0;
    var lowestSec = 1.0;
    await jumps.forEach(async jump => {
        let sec = await systems.getSystemSecurityFromID(jump);
        if (sec < lowestSec) {
            lowestSec = sec;
        }
        if (sec >= 0.5) {
            highsecJumps += 1;
        }
        else if (sec <= 0.4 && sec >= 0.1) {
            lowsecJumps += 1;
        }
        else if (sec < 0.0) {
            nullsecJumps += 1;
        }
    });


    var eligibleServices = [];
    var eligibleServicesByVolume = [];
    var eligibleServicesByCollateral = [];

    var serviceCharges = [];

    const services = await Service.find({}).exec();
    //check eligibility by sec status

    services.forEach(service => {

        if (((!service.runsIn.highsec) && highsecJumps > 0) || ((!service.runsIn.lowsec) && lowsecJumps > 0) || ((!service.runsIn.nullsec) && nullsecJumps > 0)) {
            //pass
        }
        else {
            eligibleServices.push(service.name);
        }
    })


    //check eligibility by max volume

    services.forEach(service => {
        if (parseInt(volume) <= service.maxVolume && eligibleServices.includes(service.name)) {
            eligibleServicesByVolume.push(service.name);
        }
        else {
            //volume exceeded , pass
        }
    })

    //check eligibility by max collateral

    services.forEach(service => {
        if (parseInt(collateral) <= service.maxCollateral && eligibleServicesByVolume.includes(service.name)) {
            eligibleServicesByCollateral.push(service.name);
        }
        else {
            //volume exceeded , pass
        }
    })


    //filter by rush shipping avalaibility

    let eligibleServicesByRush = [];

    services.forEach(service => {
        if (eligibleServicesByCollateral.includes(service.name)) {
            if ((req.body.isRush == 'true' && service.isRush) || req.body.isRush == 'false') {
                eligibleServicesByRush.push(service.name)
            }
        }
    });


    //get prices for eligible services

    services.forEach(service => {

        if (eligibleServicesByRush.includes(service.name)) {
            //if service is eligible
            let priceDetails = {
                name: service.name,
                price: 0
            };

            priceDetails.price = (service.highsecPrice * highsecJumps) + (service.lowsecPrice * lowsecJumps) + (service.nullsecPrice * nullsecJumps);

            if (req.body.isRush == 'true') {
                console.log(service.rushMultiplier);
                priceDetails.price *= service.rushMultiplier;
                if (priceDetails.price < service.minRushPrice) {
                    priceDetails.price = service.minRushPrice;
                }
            }


            serviceCharges.push(priceDetails);
        }

    });

    //save to db

    let lowestPrice = Infinity;

    serviceCharges.forEach(service => {
        if (service.price < lowestPrice) {
            lowestPrice = service.price;
            bestServiceType = service.name;
        }
    });

    const toSave = new Appraisal({
        key: randomstring.generate(8),
        from: sourceName,
        to: destinationName,
        volume,
        reward: lowestPrice,
        collateral,
        jumps: jumpCount
    });

    const saved = await toSave.save();

    //SEND RESPONSE

    System.find({}, (err, systems) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            res.send({ errorLines, systems, sourceName, destinationName, volume, price, collateral, jumpCount, serviceCharges, lowestSec, saved });
        }
    })
});

//BG - 250522 - addition for custom contract requests
app.post("/custom", async (req, res) => {
    let errorLines = "";


    //MAKE API REQUEST
    const response = await fetch('https://janice.e-351.com/api/rest/v2/appraisal?market=2&designation=appraisal&pricingVariant=immediate&persist=true&compactize=true&pricePercentage=1', {
        method: 'post',
        body: req.body.itemList,
        headers: { 'Content-Type': 'text/plain', "X-ApiKey": "07RzWN1u39rubweDFsk1p5SjnxTNlCdi", "accept": "application/json" }
    });
    const data = await response.json();
    let volume, price;
    try {
        volume = (Math.round((parseInt(data.totalPackagedVolume)  || 0) * 100) /100) + (parseInt(req.body.additionalVolume) || 0 );
        price = Math.round(data.effectivePrices.totalSellPrice);
        errorLines = data.failures;
    }
    catch (err) {
        res.send({ "err": "Invalid Input" });
        return;
    }
    const collateral = (parseInt(price) || 0) + (parseInt(req.body.additionalCollateral) || 0);
    const { source, destination } = req.body;
    const sourceName = await systems.getSystemName(source), destinationName = await systems.getSystemName(destination);
    const isRush = req.body.isRush;
    const eveCharacterName = req.body.eveCharacterName;
    const discordId = req.body.discordId;
    const structureType = req.body.structureType;
    const rushTargetDate = req.body.rushTargetDate;
    const submittedDate = Date.now();
    const toSave = new Custom({
        key: randomstring.generate(8),
        from: sourceName,
        to: destinationName,
        isRush,
        volume,
        collateral,
        eveCharacterName,
        discordId,
        structureType,
        rushTargetDate,
        submittedDate
    });

    const saved = await toSave.save();

    //SEND RESPONSE

    System.find({}, (err, systems) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            res.send({ errorLines, systems, sourceName, destinationName, volume, price, collateral, saved });
        }
    })

    const currentSettings = await Settings.findOne({}).exec();
    if (!currentSettings.customDiscordEnabled) {
        console.log("Skipping custom discord notifications");

    }
    else {

        console.log("Starting custom discord notification");

        //console.log(currentSettings.discordEnabled);
        let customRequest = await Custom.find({ discordNotified: false}).exec();

        for (contract of customRequest) {
            // this is now a rush contract and therefore a discord notification is required
              let notificationJson = customJsonBuilder.buildJson(
                  contract.from,
                  contract.to,
                  contract.isRush,
                  contract.rushTargetDate,
                  contract.volume,
                  contract.collateral,
                  contract.eveCharacterName,
                  contract.discordId,
                  contract.structureType,
                  contract.submittedDate,
                  process.env.CUSTOM_DISCORD_ROLE_ID)

            //console.log(JSON.stringify(notificationJson));

            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://discord.com/api/webhooks/' + process.env.CUSTOM_DISCORD_SERVER_ID + '/' + process.env.CUSTOM_DISCORD_WEBHOOK_TOKEN,
                method: 'POST',
                json: notificationJson
            };

              try {
                await request.post(options);
                const filter = { key: contract.key };
                const update = { discordNotified: true };
                await Custom.findOneAndUpdate(filter, update);
              }
              catch (err) {
                console.log(err)
              }
            console.log ('Custom Discord Notification for ' + contract.eveCharacterName + ' being sent.')
          }
        }

})




app.post("/system/add/:name", async (req, res) => {
    const systemName = req.params.name;

    System.findOne({ name: systemName }, async (err, doc) => {
        if (err) {
            res.sendStatus(500);
        }
        else {
            if (doc == null) {
                const systemDetails = await systems.getSystemDetailsFromName(systemName);
                const newSystem = new System({
                    name: systemDetails.name,
                    id: systemDetails.id,
                    security: systemDetails.security
                });
                await newSystem.save();
                res.sendStatus(200);
            }
            else {
                res.sendStatus(200);
            }
        }
    })


})



app.post("/jf", async (req, res) => {
    const { routeID, isRush, itemList, additionalVolume, additionalCollateral } = req.body;


    let errorLines = "";

    let volume, price;
    if (itemList != "") {

    //MAKE API REQUEST
    const response = await fetch('https://janice.e-351.com/api/rest/v2/appraisal?market=2&designation=appraisal&pricingVariant=immediate&persist=true&compactize=true&pricePercentage=1', {
        method: 'post',
        body: req.body.itemList,
        headers: { 'Content-Type': 'text/plain', "X-ApiKey": "07RzWN1u39rubweDFsk1p5SjnxTNlCdi", "accept": "application/json" }
    });
    const data = await response.json();

    try {
        volume = (Math.round((parseFloat(data.totalPackagedVolume)  || 0) * 100) /100) + (parseFloat(req.body.additionalVolume) || 0 );
        price = Math.round(data.effectivePrices.totalSellPrice);
        errorLines = data.failures;
    }
    catch (err) {
        res.send({ "err": "Invalid Input" });
                console.log(err);
        return;
    }

}
else {
      volume = (parseFloat(req.body.additionalVolume) || 0 );
      price = 0;
}

    let collateral = (parseFloat(price) || 0) + (parseFloat(additionalCollateral) || 0);
    let reward = 0;
    let servicePricing = "ISK per m<sup>3</sup>"


    //save to db




    Routes.findOne({ "_id": routeID }, async (err, route) => {
        if (err) {
            res.send({ "err": err });
        }
        else {
            if (volume > route.maxVolume) {
                res.send({
                    "err": "Maximum Volume Exceeded"
                });
                return;
            }
            if (collateral > route.maxCollateral) {
                res.send({
                    "err": "Maximum Collateral Exceeded"
                });
                return;
            }
            if (route.isFlat) {
                servicePricing = "Flat Charge"
                reward = route.flatPrice;
            }
            else {
                reward = Math.round(((volume * route.price) + (collateral * (route.collateralMultiplier / 100)))*100)/100;
                if (reward < route.minReward) {
                    reward = route.minReward;
                }
            }

            // is rush shipping
            if (isRush == "true") {
                if (route.isRush) {
                    reward += route.rushShippingCharge;
                }
                else {
                    res.send({ "err": "Rush Shipping Not Available For This Route" });
                    return;
                }
            }

            const toSave = new Appraisal({
                key: randomstring.generate(8),
                from: route.start,
                to: route.destination,
                service: "Standard Routes",
                volume,
                reward,
                collateral,
            });

            const saved = await toSave.save();

            const toSend = { errorLines, route, volume, price, servicePricing, reward, collateral, saved };
            res.send(toSend);

        }
    })
});

app.get('/auth/eve', authAdmin, passport.authenticate('eveOnline'));

app.get('/auth/callback', passport.authenticate('eveOnline', { failureRedirect: '/' }), async function (req, res) {

    setNewTrack(req.user);
    res.sendStatus(200);
});


app.get("/contracts", authHauler, async (req, res) => {
    let contracts = await Contracts.find({});
    let routes = [];
    const current = Date.parse(new Date());
    contracts.forEach(contract => {
        if (contract.status == "outstanding") {
            let from = contract.start;
            let to = contract.end;
            let found = false;
            routes.forEach(route => {
                if (route.from == from && route.to == to) {
                    route.volume += contract.volume;
                    route.reward += contract.reward;
                    route.collateral += contract.collateral;
                    route.count += 1;
                    route.totalTime += (current - Date.parse(contract.date));
                    if ((current - Date.parse(contract.date)) > route.maxTime) {
                        route.maxTime = (current - Date.parse(contract.date));
                    }
                    found = true;
                }
            });
            if (!found) {
                routes.push({
                    from,
                    to,
                    count: 1,
                    volume: parseInt(contract.volume),
                    reward: parseInt(contract.reward),
                    collateral: parseInt(contract.collateral),
                    totalTime: current - Date.parse(contract.date),
                    maxTime: current - Date.parse(contract.date)
                });
            }
        }
    });
    res.render("contracts.ejs", { contracts, routes });
});

app.get("/contracts/raw", (req, res) => {
    res.send(userContracts);
})

app.get("/statistics", (req, res) => {
    res.send(statistics);
});


resumeTrack();

async function resumeTrack() {

    fetchStatistics();
    cronID = setInterval(fetchStatistics, 300000);
    setInterval(mailContracts, 60000);
    setInterval(discordNotification, 60000);

}

async function setNewTrack(user) {

    clearInterval(cronID);

    const update = {
        characterID: user.profile.CharacterID,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    await Characters.findOneAndUpdate({ tracking: true }, update, options).exec();
    fetchStatistics();
    cronID = setInterval(fetchStatistics, 300000);
    setInterval(mailContracts, 60000);

}

async function fetchStatistics() {

    toTrack = await Characters.findOne({ tracking: true }).exec();
    console.log("refreshing token");
    toTrack.accessToken = await refreshToken(toTrack.refreshToken);
    console.log("fetching stats");
    userContracts = [];
    await getAllContracts(toTrack);

    let numbers = {
        outstanding: 0,
        time: 0
    };
    if (!userContracts || userContracts.length == 0) {
        res.send(numbers);
        return;
    }
    userContracts.forEach(contract => {
        if (contract.type == "courier") {
            if (contract.status == "outstanding") {
                numbers.outstanding += 1;
            }
        }
    });


    let toAverage = 50;
    let average = 0;
    userContracts.slice().reverse().forEach(x => {
        if (x.status == "finished" && toAverage > 0) {
            const start = new Date(x.date_issued);
            const finish = new Date(x.date_completed);
            const difference = Math.abs(finish - start);
            let hours = (difference / (1000 * 60 * 60)).toFixed(1);
            if (!isNaN(hours)) {
                average += parseFloat(hours);
                toAverage -= 1;
            }
        }
    })

    // console.log(average);
    average /= 50;
    numbers.time = Math.round(average);
    statistics = numbers;

    await processContracts(toTrack);
    saveContracts();

}


async function saveContracts() {

    console.log("saving contracts");
    for (contract of userContracts) {
        const toSave = {
            date: contract.date_issued,
            dateCompleted: contract.date_completed,
            type: contract.type,
            contractID: contract.contract_id,
            status: contract.status,
            issuerID: contract.issuer_id,
            issuerName: contract.issuer_name,
            start: contract.start_location_id,
            end: contract.end_location_id,
            volume: contract.volume,
            reward: contract.reward,
            collateral: contract.collateral,
            description: contract.title,
            service: contract.service,
            key: contract.key,
            secondaryValidationReward: contract.secondaryValidationReward,
            acceptorId: contract.acceptor_id,
            acceptorName: contract.acceptor_name,
            appraisalReward: contract.appraisalReward,
            appraisalCollateral: contract.appraisalCollateral,
            appraisalVolume: contract.appraisalVolume,
            appraisalService: contract.appraisalService,
            appraisalFrom: contract.appraisalFrom,
            appraisalTo: contract.appraisalTo,
            appraisalJumps: contract.appraisalJumps
        };

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        try {
            Contracts.findOneAndUpdate({ contractID: contract.contract_id }, toSave, options, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                }
            });
        }
        catch (ex) {
            //pass
        }
    }
    console.log("all saved");
}


async function getAllContracts(user) {
    let currentPage = 1;
    let contracts = [];
    do {
        contracts = [];
        contracts = await getContracts(user, currentPage);
        console.log(contracts.length);
        userContracts = userContracts.concat(contracts);
        currentPage += 1;
    } while (contracts.length != 0);
}

async function getContracts(user, page) {
    return new Promise(async (resolve, reject) => {
        request.get('https://esi.evetech.net/latest/corporations/' + trackingCorp + '/contracts/?page=' + page + '&token=' + encodeURI(user.accessToken), async function (err, res, body) {
            if (err) {

            } else {
                if (JSON.parse(res.body).error) {
                    if (JSON.parse(res.body).error != "Undefined 404 response. Original message: Requested page does not exist!") {
                        reject(JSON.parse(res.body));
                    }
                    else {
                        resolve([]);
                    }
                }
                else {
                    resolve(JSON.parse(res.body));
                }
            }
        });
    });
}

async function processContracts(user) {


    console.log("Processing Contracts");

    newUserContracts = []

    const dbContracts = await Contracts.find({}).exec();

    for (contract of userContracts) {

        let found = false;
        let foundContract = null;

        for (dbContract of dbContracts) {
            if (dbContract.contractID == contract.contract_id) {
                found = true;
                foundContract = dbContract;
                if (dbContract.status != contract.status) {
                    dbContract.status = contract.status;
                    newUserContracts.push(contract);
                    try {
                        contract.acceptor_name = await getCharacterName(contract.acceptor_id);
                    }
                    catch (err) {
                        contract.acceptor_name = "-";
                    }
                }
                break;
            }
        }

        if (found && isNaN(foundContract.start)) {
            continue;
        }

        try {
            contract.issuer_name = await getCharacterName(contract.issuer_id);
        }
        catch (err) {
            contract.issuer_name = "-";
        }
        try {
            contract.acceptor_name = await getCharacterName(contract.acceptor_id);
        }
        catch (err) {
            contract.acceptor_name = "-";
        }
        try {
            contract.start_location_id = await getLocationName(contract.start_location_id, user);
        }
        catch (err) {
            contract.start_location_id = "-";
        }
        try {
            contract.end_location_id = await getLocationName(contract.end_location_id, user);
        }
        catch (err) {
            contract.end_location_id = "-";
        }
        contract.title = contract.title.toString().trim();
        contract.service = contract.title.split("-")[0];
        contract.key = contract.title.split("-")[2];
        const appraisal = await Appraisal.findOne({ key: contract.key }).exec();
        if (appraisal) {
            contract.appraisalReward = appraisal.reward;
            contract.appraisalCollateral = appraisal.collateral;
            contract.appraisalVolume = appraisal.volume;
            contract.appraisalFrom = appraisal.from;
            contract.appraisalTo = appraisal.to;
            contract.appraisalService = appraisal.service;
            contract.appraisalJumps = appraisal.jumps
        }
        //Guesstimate of whether the contract is valid or not
        else {
          let start = " ";
          let end = " ";
          //let start = contract.start;
          if (contract.start_location_id) {
          start = contract.start_location_id.split(" ")[0] ;
          }
          if (contract.end_location_id) {
          end = contract.end_location_id.split(" ")[0];
          }
          const routes = await Routes.findOne({$and: [ {start: {"$regex":"^" + start + "*"}},{destination: {"$regex":"^" + end + "*"}} ] });
          let validatedReward = 0;
          let calculatedReward = 0;
          //If I can find a route validate the reward
          if (routes) {
            if (routes.isFlat) {
                validatedReward = contract.reward / routes.flatPrice;
            }
            else {
            calculatedReward = ((contract.volume * routes.price) + (contract.collateral * (parseFloat(routes.collateralMultiplier)/100)));
            if (contract.reward != 0) {
            let rewardDelta = contract.reward  / calculatedReward;
            validatedReward = rewardDelta;
          }
        }
        }
        else {
          validatedReward = -1;
        }
          contract.secondaryValidationReward = (Math.round((validatedReward  || 0) * 100) /100);
        }
        newUserContracts.push(contract);

    }

    userContracts = newUserContracts;

    console.log("Processing Complete");


}

async function getLocationName(id, user) {

    return new Promise(async (resolve, reject) => {
        if (id_cache.hasOwnProperty(id)) {
            resolve(id_cache[id]);
        }
        else {
            if (id.toString().length == 8) {
                //NPC station
                let response;
                try {
                    response = await fetch('https://esi.evetech.net/latest/universe/names/?datasource=tranquility', {
                        method: 'post',
                        body: "[" + id + "]",
                        headers: { 'Content-Type': 'application/json', "User-Agent": "Multi-Lemm Logistics Calculator" }
                    });
                }
                catch (err) {
                    reject(err);
                }
                const body = await response.json();
                let name = body[0].name;
                id_cache[id] = name;
                resolve(name);
            }
            else if (id.toString().length == 13) {
                request.get('https://esi.evetech.net/latest/universe/structures/' + id + '/?token=' + encodeURI(user.accessToken), async function (err, res, body) {
                    if (err) {
                        reject(err);
                    }
                    id_cache[id] = JSON.parse(body).name;
                    resolve(JSON.parse(body).name);
                });
            }
            else {
                resolve(id);
            }
        }
    })
}

async function getCharacterName(id) {
    return new Promise(async (resolve, reject) => {
        if (id_cache.hasOwnProperty(id)) {
            resolve(id_cache[id]);
        }
        else {
            let response;
            try {
                response = await fetch('https://esi.evetech.net/latest/universe/names/?datasource=tranquility', {
                    method: 'post',
                    body: "[" + id + "]",
                    headers: { 'Content-Type': 'application/json', "User-Agent": "Multi-Lemm Logistics Calculator" }
                });
            }
            catch (err) {
                reject(err);
            }
            const body = await response.json();
            if (body.error || body.err) {
                reject(body.err);
            }
            id_cache[id] = body[0].name;
            resolve(body[0].name);
        }
    });
}

async function mailContracts() {

    const currentSettings = await Settings.findOne({}).exec();
    if (currentSettings.mailsEnabled == false) {
        console.log("skipping mails");
        return;
    }
    else {

        console.log("Starting mailing");

        let contracts = await Contracts.find({ mailed: false, status: "outstanding" }).exec();
        for (contract of contracts) {
            let action = "approve";
            let noCode = false;
            if (!contract.appraisalReward && !contract.appraisalCollateral && !contract.appraisalVolume) {
                noCode = true
            }
            let rewardDelta = contract.reward / contract.appraisalReward;
            let collateralDelta = contract.collateral / contract.appraisalCollateral;
            let volumeDelta = contract.volume / contract.appraisalVolume;
            if (!(rewardDelta >= 0.9 && collateralDelta >= 0.9 && volumeDelta >= 0.95 && volumeDelta <= 1.05) && !noCode) {
                action = "delta error";
            }
            if (contract.appraisalService == "Standard Routes" && !(contract.start.includes(contract.appraisalFrom.substring(0, contract.appraisalFrom.indexOf(' '))) && contract.end.includes(contract.appraisalTo.substring(0, contract.appraisalTo.indexOf(' ')))) && !noCode) {
                action = "route error";
            }
            if (contract.type == "item_exchange") {
                action = "type error";
            }
//contract.issuerID
            let toMail = {
                "approved_cost": 0,
                "recipients": [
                    {
                        "recipient_id": contract.issuerID,
                        "recipient_type": "character"
                    }
                ],
            }


            if (noCode && action != "type error") {
                toMail.body = process.env.MAIL_BODY_CODE
                toMail.subject = process.env.MAIL_SUBJECT_CODE;
            }

            else {
                if (action == "approve") {
                    toMail.body = process.env.MAIL_BODY_RECEIEVED;
                    toMail.subject = process.env.MAIL_SUBJECT_RECEIVED;
                }
                else if (action == "delta error") {
                    if (rewardDelta < 0.9) {
                        toMail.body = process.env.MAIL_BODY_REWARD;
                        toMail.subject = process.env.MAIL_SUBJECT_REWARD;
                    }
                    else if (collateralDelta < 0.9) {
                        toMail.body = process.env.MAIL_BODY_COLLATERAL;
                        toMail.subject = process.env.MAIL_SUBJECT_COLLATERAL;
                    }
                    else {
                        toMail.body = process.env.MAIL_BODY_VOLUME;
                        toMail.subject = process.env.MAIL_SUBJECT_VOLUME;

                    }
                }
                else if (action == "route error") {
                    toMail.body = process.env.MAIL_BODY_ROUTE;
                    toMail.subject = process.env.MAIL_SUBJECT_ROUTE;
                }
                else if (action == "type error") {
                    toMail.body = process.env.MAIL_BODY_TYPE;
                    toMail.body = process.env.MAIL_SUBJECT_TYPE;
                }
            }

            if ((noCode) && (action != "approve")) {
              action = 'Missing validation code & ' + action;
            }
            else if ((noCode) && (action = "approve")) {
              action = 'Missing validation code';
            }


            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://esi.evetech.net/latest/characters/' + process.env.CHARACTER_ID + '/mail/?token=' + encodeURI(toTrack.accessToken),
                method: 'POST',
                json: toMail
            };

            try {
                await request.post(options);
                const filter = { contractID: contract.contractID };
                const update = { mailed: true, validationStatus: action };
                await Contracts.findOneAndUpdate(filter, update);
            }
            catch (err) {
                console.log(err)
            }

        }
        contracts = await Contracts.find({ mailed: true, deliveryAcknowledged: false, status: "finished" }).exec();
        for (contract of contracts) {
          //contract.issuerID

            let toMail = {
                "approved_cost": 0,
                "recipients": [
                    {
                        "recipient_id": contract.issuerID,
                        "recipient_type": "character"
                    }
                ],
            }

            toMail.body = process.env.MAIL_BODY_DELIVERED;
            toMail.subject = process.env.MAIL_SUBJECT_DELIVERED;


            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://esi.evetech.net/latest/characters/' + process.env.CHARACTER_ID + '/mail/?token=' + encodeURI(toTrack.accessToken),
                method: 'POST',
                json: toMail
            };

            try {
                await request.post(options);
                const filter = { contractID: contract.contractID };
                const update = { deliveryAcknowledged: true };
                await Contracts.findOneAndUpdate(filter, update);
            }
            catch (err) {
                console.log(err)
            }


        }

        console.log("All mails sent");
    }
    //discordNotification();
}


//BG Additions for Discord Bot
async function discordNotification() {

    const currentSettings = await Settings.findOne({}).exec();
    //console.log(currentSettings.discordEnabled);
    if (!currentSettings.discordEnabled) {
        console.log("Skipping discord notification");
    }
    else {

        console.log("Starting discord notification");

        let contracts = await Contracts.find({ discordNotified: false, status: "outstanding" }).exec();
        for (contract of contracts) {
          let serviceType = contract.description.split("-")[1];

          if (serviceType == 'R' && Boolean(contract.validationStatus)) {
            // this is now a rush contract and therefore a discord notification is required
              let notificationJson = jsonBuilder.buildJson(
                  'firstNotification',
                  contract.service,
                  contract.issuerName,
                  contract.start,
                  contract.end,
                  contract.volume,
                  contract.status,
                  contract.validationStatus,
                  contract.date,
                  contract.issuerID,
                  process.env.DISCORD_ROLE_ID)

            //console.log(JSON.stringify(notificationJson));

            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://discord.com/api/webhooks/' + process.env.DISCORD_SERVER_ID + '/' + process.env.DISCORD_WEBHOOK_TOKEN,
                method: 'POST',
                json: notificationJson
            };

              try {
                await request.post(options);
                const filter = { contractID: contract.contractID };
                const update = { discordNotified: true, discordNotificationTime: Date.now()};
                await Contracts.findOneAndUpdate(filter, update);
              }
              catch (err) {
                console.log(err)
              }
            console.log ('Discord Notification for ' + contract.issuerName + ' being sent.')
          }
          else if (serviceType == 'R' && !contract.validationStatus){
            console.log("Discord method has run before contract has been validated, will exit without notification.");
          }
          else {
            try {
                const filter = { contractID: contract.contractID };
                const update = { discordNotified: true, discordReminderSent: true, rushContractExpired: true};
                await Contracts.findOneAndUpdate(filter, update);
            }
            catch (err) {
                console.log(err)
            }
          }

        }

        console.log("Checking for discord reminders");
        let notificationContracts = await Contracts.find({ discordNotified: true, status: "outstanding", discordNotificationTime: {$ne: null}, discordReminderSent: false}).exec();
        for (contract of notificationContracts) {
            // this is now a rush contract and therefore a discord notification is required
              let timePassed = moment().diff(moment(contract.discordNotificationTime), 'hours');
              if (timePassed >= 12) {
                let notificationJson = jsonBuilder.buildJson(
                    'reminderNotification',
                    contract.service,
                    contract.issuerName,
                    contract.start,
                    contract.end,
                    contract.volume,
                    contract.status,
                    contract.validationStatus,
                    contract.date,
                    contract.issuerID,
                    process.env.DISCORD_ROLE_ID)

            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://discord.com/api/webhooks/' + process.env.DISCORD_SERVER_ID + '/' + process.env.DISCORD_WEBHOOK_TOKEN,
                method: 'POST',
                json: notificationJson
            };

              try {
                await request.post(options);
                const filter = { contractID: contract.contractID };
                const update = { discordReminderSent: true};
                await Contracts.findOneAndUpdate(filter, update);
              }
              catch (err) {
                console.log(err)
              }
            console.log ('Discord Reminder Notification for ' + contract.issuerName + ' has been sent.')
          }

        }

        console.log("Checking for expired contracts");
        let rushExpiredContracts = await Contracts.find({ discordNotified: true, status: "outstanding", discordNotificationTime: {$ne: null}, discordReminderSent: true, rushContractExpired: false}).exec();
        for (contract of rushExpiredContracts) {
            // this is now a rush contract and therefore a discord notification is required
              let timePassed = moment().diff(moment(contract.discordNotificationTime), 'hours');
              if (timePassed >= 24) {
                let notificationJson = jsonBuilder.buildJson(
                    'expiredNotification',
                    contract.service,
                    contract.issuerName,
                    contract.start,
                    contract.end,
                    contract.volume,
                    contract.status,
                    contract.validationStatus,
                    contract.date,
                    contract.issuerID,
                    process.env.DISCORD_ROLE_ID)

            headers = { 'Content-type': 'application/json', 'Accept': 'text/plain' }

            var options = {
                uri: 'https://discord.com/api/webhooks/' + process.env.DISCORD_SERVER_ID + '/' + process.env.DISCORD_WEBHOOK_TOKEN,
                method: 'POST',
                json: notificationJson
            };

              try {
                await request.post(options);
                const filter = { contractID: contract.contractID };
                const update = { rushContractExpired: true};
                await Contracts.findOneAndUpdate(filter, update);
              }
              catch (err) {
                console.log(err)
              }
            console.log ('Contract Expired Notification for ' + contract.issuerName + ' has been sent.')
          }

        }

        console.log("Discord Notification Method Complete");
    }
}





async function refreshToken(token) {

    var details = {
        'grant_type': 'refresh_token',
        'refresh_token': encodeURI(token),
    };


    var formBody = [];
    for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    const contentHeader = "application/x-www-form-urlencoded";
    const hostHeader = "login.eveonline.com";
    const authHeader = "Basic " + process.env.AUTHSTR;

    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
        method: 'post',
        body: formBody,
        headers: { 'Content-Type': contentHeader, 'Host': hostHeader, 'Authorization': authHeader }
    });
    const data = await response.json();

    if (data.error) {
        console.log(data.error);
    }

    if (!data.error) {

        const update = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token
        };

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };


        await Characters.findOneAndUpdate({ tracking: true }, update, options).exec();
    }
    return data;
};

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
    });


function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}
