const express = require("express");
var cors = require('cors');
const dotenv = require('dotenv');
var cookieParser = require('cookie-parser');
var timeout = require('connect-timeout');
const raffle = require("./controllers/raffle.controller.js");
const responseTime = require('response-time');
const helmet = require('helmet');
const requestIp = require('request-ip');
require('newrelic');

dotenv.config({ path: './.env' });

const app = express();

app.use(helmet())
app.use(timeout('15s'))
app.use(haltOnTimedout)
app.use(cookieParser())
app.use(haltOnTimedout)
app.use(responseTime((req, res, time) => {  
  console.log(`${req.url} ${time}`);  
}))

const cron = require('node-cron');


app.use(requestIp.mw());


app.use(cors({origin: true}));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to The Four Kingdoms API !" });
});

require("./routes/startup.js")(app);

cron.schedule('*/30 * * * * * *', async function() {

  console.log('Every 30 seconds');
  // DRAW WINNER RAFFLE 
    await raffle.drawWinners();
    // DRAW WINNER RAFFLE
});


function haltOnTimedout (req, res, next) {
  if (!req.timedout) next();
}

var http = require("http");
var port = process.env.PORT || 8080;
var server = http.createServer(app)
server.listen(port);