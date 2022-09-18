
const Admin = require("../models/admin.model.js");
const Transactions = require("../models/transactions.model.js");
const Raffle = require("../models/raffle.model.js");
var crypto = require('crypto');
const Discord = require("../models/discord.model.js");

exports.login = async (req, res) => {
    const hash = crypto.pbkdf2Sync(process.env.REACT_APP_ADMIN_PASSWORD, process.env.REACT_APP_ADMIN_SALT, 1000, 64, 'sha512').toString('hex');

    const discord = await Discord.selectAll(); 
   if(req.params.password === hash){
    res.status(200).send({
        message:"Login successfully",
        infos:discord
    });
   }
   else {
    res.status(404).send({
        message:"Login failed"
    });
   }
}

exports.delete = async (req, res) => {
 
    const hash = crypto.pbkdf2Sync(process.env.REACT_APP_ADMIN_PASSWORD, process.env.REACT_APP_ADMIN_SALT, 1000, 64, 'sha512').toString('hex');

    if(req.body.password === hash){
        const resUpdate = await Admin.delete(req.body.id);
        console.log('here');
        if(resUpdate == "err"){
            res.status(404).send({
            message: "Error during the suppression of the raffle"
            });
        }
        else if(resUpdate == "not_found") {
            res.status(404).send({
            message: "Can't delete raffle because not found"
            });
        }
        else {
            res.status(200).send("Raffle deleted");
        }
    }
    else {
     res.status(404).send("Login failed");
    }
 }

exports.create = async (req, res) => {

   const hash = crypto.pbkdf2Sync(process.env.REACT_APP_ADMIN_PASSWORD, process.env.REACT_APP_ADMIN_SALT, 1000, 64, 'sha512').toString('hex');

   if(req.body.password === hash){

    if(req.body.image && req.body.price > 0 && req.body.title != "" && req.body.price > 0 && req.body.end_raffle > 0){

        const registrationOpen = await Raffle.isRaffleExist(req.body.id);
        // Update of existant raffle
            if(registrationOpen){
                const raffleAdmin = new Admin({
                    title: req.body.title,
                    twitter: req.body.twitter,
                    image: req.body.image,
                    solscan: req.body.solscan,
                    price: req.body.price,
                    end_raffle: req.body.end_raffle,
                    maxTickets: req.body.maxTickets,
                    categorie: req.body.categorie,
                    numberWinners: req.body.numberWinners,
                    collection: req.body.collection,
                    description: req.body.description,
                    eth: req.body.eth
                });
                const resUpdate = await Admin.update(req.body.id, raffleAdmin);
                if(resUpdate == "err"){
                    res.status(404).send({
                    message: "Error during the update of the raffle"
                    });
                }
                else if(resUpdate == "not_found") {
                    res.status(404).send({
                    message: "Can't update raffle because not found"
                    });
                }
                else {
                    res.status(200).send("Raffle updated");
                }
            }
            // New Raffle
            else {
                console.log("NEW RAFFLE");
                const raffleAdmin = new Admin({
                    title: req.body.title,
                    twitter: req.body.twitter,
                    image: req.body.image,
                    solscan: req.body.solscan,
                    price: req.body.price,
                    end_raffle: req.body.end_raffle,
                    winner_wallet: "",
                    winner_nb_tickets: 0,
                    maxTickets: req.body.maxTickets,
                    categorie: req.body.categorie,
                    numberWinners: req.body.numberWinners,
                    collection: req.body.collection,
                    description: req.body.description,
                    eth: req.body.eth
                });
                await Admin.create(raffleAdmin);
                res.status(200).send("Raffle created");
                }
        }
        else {
            res.status(404).send("Wrong parameters");
           }
    }
   else {
    res.status(404).send("Login failed");
   }
}