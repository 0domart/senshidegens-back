
const Discord = require("../models/discord.model.js");
const {sign} = require('tweetnacl');

exports.save = async (req, res) => {

    const message =  new TextEncoder().encode('Identify yourself');
    const signature = req.body.signature;
    let key = req.body.pubKey;

    const tab = [];
    for(let i=0; i < 64; i++){
      tab[i] = signature[i.toString()];
    }

    const transaction = new Uint8Array(tab);
    const cle = new Uint8Array(key.data);
    const signatureStatut = await checkSignature(message, transaction, cle, res);

    if(signatureStatut){
        if(req.body.wallet != "" && req.body.wallet != null && req.body.discord != "" && req.body.type != ""){
            await Discord.save(req.body.wallet, req.body.discord, req.body.type);
            res.status(200).send("Discord saved");
        }
        else {
            console.log("error");
            res.status(404).send({
                message: "Error during the save of the discord informations"
            });
        }
    }
}

async function checkSignature(message, transaction, cle, res){
    if(!sign.detached.verify(message, transaction, cle)){
      res.status(400).send({
          message: "Not authorized!"
        });
        return false;
    }
    return true;
  }