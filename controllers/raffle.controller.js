const { sign } = require("tweetnacl");
const Raffle = require("../models/raffle.model.js");
const Transactions = require("../models/transactions.model.js");
const { web3 } = require("@project-serum/anchor");
const { TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const { PublicKey, Transaction } = require("@solana/web3.js");
const BufferLayout = require("@solana/buffer-layout");
var BN = require("bn.js");
var assert = require("assert");
var BN__default = /*#__PURE__*/ _interopDefaultLegacy(BN);

let Queue = require("bull");

function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e
    ? e
    : {
        default: e,
      };
}

// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let workQueue = new Queue("ddddddd", REDIS_URL);

var assert__default = /*#__PURE__*/ _interopDefaultLegacy(assert);

exports.getStatut = async (req, res) => {
  const wallet = req.params.wallet;

  let data = {};
  let result = [];

  const raffles = await Raffle.getRaffles();

  await asyncForEach(raffles, async (raffle) => {
    let tickets = await getTotalAndUserEntries(
      raffle.idraffle,
      wallet,
      raffle.maxTickets
    );

    data = {
      raffle: raffle,
      entries: tickets[0],
      userEntries: tickets[1],
      participants: tickets[2],
    };
    result.push(data);
  });

  res.status(200).send(result);
};

exports.getStatutByIdRaffle = async (req, res) => {
    const wallet = req.params.wallet;
    const idraffle = req.params.idraffle;

    let data = {};

    const raffle = await Raffle.getRaffleById(idraffle);

    if(raffle[0]){
        let tickets = await getTotalAndUserEntries(raffle[0].idraffle, wallet, raffle[0].maxTickets);

        data = {
            raffle: raffle[0],
            entries: tickets[0],
            userEntries: tickets[1],
            participants: tickets[2]
        }
    }

    res.status(200).send(data);
}

exports.getParticipants = async (req, res) => {
  const idRaffle = req.params.id;

  const raffles = await Raffle.getParticipantsByRaffle(idRaffle);

  res.status(200).send(raffles);
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getTotalAndUserEntries(idRaffle, wallet, maxTickets) {
  let raffleEntries = await Raffle.getEntriesRaffleById(idRaffle);
  let totalEntries = 0;
  let userEntries = 0;
  raffleEntries.forEach((element) => {
    totalEntries += element.tickets;
    if (element.wallet === wallet) {
      userEntries += element.tickets;
    }
  });

  if (totalEntries >= maxTickets) {
    totalEntries = maxTickets;
  }
  return [totalEntries, userEntries, raffleEntries];
}

exports.register = async (req, res) => {
  const message = new TextEncoder().encode("Sign to register in the raffle");
  const signature = req.body.signature;
  let key = req.body.pubKey;
  let idRaffle = Number(req.body.idRaffle);
  let tickets = Number(req.body.tickets);

  const tab = [];
  for (let i = 0; i < 64; i++) {
    tab[i] = signature[i.toString()];
  }

  const transaction = new Uint8Array(tab);
  const cle = new Uint8Array(key.data);
  const walletUser = new PublicKey(key.data).toBase58();
  console.log("2/", walletUser);
  const c2 = await checkSignature(message, transaction, cle, res);
  if (c2) {
    let cost = tickets * Number(process.env.REACT_APP_TICKET_PRICE);
    const registrationOpen = await Raffle.isRaffleOpen(idRaffle, walletUser);
    if (registrationOpen) {
      await Raffle.register(walletUser, idRaffle, tickets);
      await Transactions.create(walletUser, cost, "Raffle " + idRaffle);
      res.status(200).send({
        message: "Registration done",
      });
    } else {
      res.status(400).send({
        message: "Raffle closed",
      });
    }
  }
};

async function checkSignature(message, transaction, cle, res) {
  if (!sign.detached.verify(message, transaction, cle)) {
    res.status(400).send({
      message: "Not authorized!",
    });
    return false;
  }
  return true;
}

exports.drawWinners = async () => {
  const raffles = await Raffle.getRaffles();

  await asyncForEach(raffles, async (raffle) => {
    if (raffle.winner_wallet === "" && raffle.end_raffle < Date.now() - 30000) {
      console.log("Time to pick the winner !");
      let wallets = [];
      let raffleEntries = await Raffle.getEntriesRaffleById(raffle.idraffle);
      raffleEntries.forEach((element) => {
        for (let i = 0; i < element.tickets; i++) {
          wallets.push(element.wallet);
        }
      });

      if (wallets.length > 0) {
        if (raffle.numberWinners == 1) {
          wallets.sort(() => Math.random() - 0.5);
          let winnerWallet = wallets[0];
          console.log("Winner wallet is ", winnerWallet);
          let nbTicketWinner = wallets.filter(
            (obj) => obj === winnerWallet
          ).length;
          await Raffle.updateWinner(
            winnerWallet,
            nbTicketWinner,
            raffle.idraffle
          );
        } else {
          let stringWinners = "";
          for (let i = 0; i < raffle.numberWinners; i++) {
            wallets.sort(() => Math.random() - 0.5);
            let winner = wallets[0];
            if (winner !== undefined) {
              stringWinners += winner + " ";
              wallets = wallets.filter((item) => item !== winner);
            }
          }

          console.log("Winner wallets are ", stringWinners);
          await Raffle.updateWinner(stringWinners, 0, raffle.idraffle);
        }
      }
    }
  });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

exports.withdraw = async (req, res) => {
  if (process.env.REACT_APP_RAFFLE_ENABLE) {
    numCoins = req.body.numCoins;
    walletFrom = req.body.wallet;

    let decimals = web3.LAMPORTS_PER_SOL;
    const tokenMintAddress = process.env.REACT_APP_TOKEN_MINT_ADRESS;

    // Connection
    const connection = new web3.Connection(process.env.REACT_APP_RPC_URL, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60 * 1 * 1000,
    });
    // End Connection

    const keyData = [
      112, 9, 246, 225, 152, 88, 126, 249, 36, 178, 4, 56, 67, 15, 90, 120, 14,
      130, 68, 145, 221, 11, 165, 187, 231, 53, 13, 200, 160, 172, 7, 244, 124,
      124, 157, 229, 126, 223, 46, 244, 48, 192, 68, 127, 175, 73, 231, 168,
      214, 154, 16, 137, 133, 66, 160, 8, 24, 7, 161, 218, 200, 61, 5, 185,
    ];
    const walletTresory = web3.Keypair.fromSecretKey(new Uint8Array(keyData));

    const mintPublicKey = new web3.PublicKey(tokenMintAddress);
    const mintToken = new Token(
      connection,
      mintPublicKey,
      TOKEN_PROGRAM_ID,
      walletTresory
    );

    const fromPubKey = new web3.PublicKey(walletFrom);

    try {
      const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
        fromPubKey
      );

      let instructions = [];

      const destPubKey = new web3.PublicKey(
        process.env.REACT_APP_WALLET_TOKEN_RECEIVER
      );

      const associatedDestinationTokenAddr =
        await Token.getAssociatedTokenAddress(
          mintToken.associatedProgramId,
          mintToken.programId,
          mintPublicKey,
          destPubKey
          //walletTresory.publicKey
        );

      const instructionTransaction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        associatedDestinationTokenAddr,
        fromPubKey,
        [],
        numCoins * decimals
      );

      instructions.push(instructionTransaction);

      instructions[0].programId = instructions[0].programId.toBytes();
      res.status(200).send(instructions);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Raffle problem, please come back later",
      });
    }
  } else {
    res.status(200).send({
      message: "Raffle disabled, please come back later",
    });
  }
};

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== "default") {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function () {
                  return e[k];
                },
              }
        );
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

exports.withdraw2 = async (req, res) => {
  if (process.env.REACT_APP_RAFFLE_ENABLE) {
    const signedRaw = req.body.signed;
    let idRaffle = req.body.idRaffle;
    let tickets = req.body.tickets;


    const signed = Transaction.from(
      Buffer.from(JSON.parse(signedRaw).data, "base64")
    );

    console.log("1/", signed.feePayer.toBase58());
    const registrationOpen = await Raffle.isRaffleOpen(idRaffle, tickets, signed.feePayer.toBase58());

    if (registrationOpen[0]) {
      const walletReceiver = signed.feePayer.toBase58();

      if (
        process.env.REACT_APP_TOKEN_PROGRAM_ACCOUNT_RECEIVER ===
        signed.instructions[0].keys[1].pubkey.toBase58()
      ) {
        // Connection
        const connection = new web3.Connection(process.env.REACT_APP_RPC_URL, {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 60 * 1.5 * 1000,
        });
        // End Connection

        const transact = signed;

        var BufferLayout__namespace =
          /*#__PURE__*/ _interopNamespace(BufferLayout);

        const uint64 = (property = "uint64") => {
          return BufferLayout__namespace.blob(8, property);
        };

        const TransferInstructionLayout = BufferLayout.struct([
          BufferLayout.u8("instruction"),
          uint64("amount"),
        ]);
        const instructionData = TransferInstructionLayout.decode(
          signed.instructions[0].data
        );
        let decimals = web3.LAMPORTS_PER_SOL;
        const NUMBER_OF_COINS =
          Number(u64.fromBuffer(instructionData.amount)) / decimals;

        // Check if user has enough coins to make the withdrawal.
        if (
          parseFloat(
            Number(tickets * Number(registrationOpen[1])).toFixed(3)
          ) <= NUMBER_OF_COINS
        ) {
          res.setTimeout(25000, function () {
            res
              .status(404)
              .send(
                "Problem during the raffle, please try later or contact an admin"
              );
          });

          let signature = "";
          let catch1 = true;
          try {

            signature = await connection.sendRawTransaction(
              transact.serialize(),
              {
                skipPreflight: true,
                maxRetries: 100,
                preflightCommitment: "confirmed"
              }
            );
            console.log("signature of token transfer:", signature);
            await Transactions.create(
              walletReceiver,
              NUMBER_OF_COINS,
              "Raffle " + idRaffle + " " + signature
            );
          } catch (error) {
            console.log(error);
            catch1 = false;
            res.status(200).send({
              message:
                "Problem during the raffle, took to much time to sign the transaction",
            });
          }

          let jobId = 0;
          if (catch1) {
            try {
              const data = {
                signature: signature,
                walletReceiver: walletReceiver,
                numberCoins: NUMBER_OF_COINS,
                idRaffle: idRaffle,
                tickets: tickets,
              };
              console.log("still3");
              let job = await workQueue.add(data);
              jobId = job.id;

              res.status(200).send({
                queueList: jobId,
                message: "Transaction in progress",
              });
            } catch (error) {
              await Transactions.create(
                walletReceiver,
                NUMBER_OF_COINS,
                "Raffle error " + +idRaffle + " " + signature
              );

              res.status(200).send({
                message:
                  "Problem during the raffle, please try later or contact an admin",
              });
              // Create dans la table
            }
          }
        } else {
          res.status(404).send({
            message:
              "Problem during the raffle, please try later or contact an admin",
          });
        }
      }
      // Not enought coin
      else {
        res.status(404).send({
          message:
            "Problem during the raffle, please try later or contact an admin",
        });
      }
    } else {
      res.status(404).send({
        message: "Raffle closed",
      });
    }
  } else {
    res.status(404).send({
      message: "Raffle disabled, please come back later",
    });
  }
};

exports.check = async (req, res) => {
  const id = req.params.id;
  let job = await workQueue.getJob(id);

  if (job === null) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    res.status(200).send({ id, state, progress, reason });
  }
};

class u64 extends BN__default["default"] {
  /**
   * Convert to Buffer representation
   */
  toBuffer() {
    const a = super.toArray().reverse();
    const b = buffer.Buffer.from(a);

    if (b.length === 8) {
      return b;
    }

    assert__default["default"](b.length < 8, "u64 too large");
    const zeroPad = buffer.Buffer.alloc(8);
    b.copy(zeroPad);
    return zeroPad;
  }
  /**
   * Construct a u64 from Buffer representation
   */

  static fromBuffer(buffer) {
    assert__default["default"](
      buffer.length === 8,
      `Invalid buffer length: ${buffer.length}`
    );
    return new u64(
      [...buffer]
        .reverse()
        .map((i) => `00${i.toString(16)}`.slice(-2))
        .join(""),
      16
    );
  }
}
