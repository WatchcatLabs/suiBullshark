import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import {SuiMnemonic} from "./src/accounts/mnemonic";
import {JsonRpcProvider, Connection, Ed25519Keypair, fromB64} from '@mysten/sui.js';
import {Sui8192} from "./src/sui8192/sui8192";
import {SuiCoinFlip} from "./src/flip/flip";
const Manager = require('./src/AI');

const ROWS = 4;
const COLUMNS = 4;

dotenv.config();
const userAccountType = process.env.USE_ACCOUNT_TYPE || "mnemonic";
const mnemonic = process.env.MNEMONIC || "";
let rpc = process.env.RPC || "";
const mnemonicIndex = Number(process.env.MNEMONIC_INDEX) || 0;
let SUI8192ObjectId = process.env.SUI8192_ObjectId

const SwitchSui8129 = process.env.Switch_Sui8129?.toLowerCase() === 'true';
const SwitchSUIFlipCoin = process.env.Switch_SUI_Flip_Coin?.toLowerCase() === 'true';
let flipCoinInterval = Number(process.env.Sui_Flip_Coin_Interval);
let flip_Coin_Amount = Number(process.env.Flip_Coin_Amount);
// Flip_Coin_Amount
if (isNaN(flipCoinInterval) || flipCoinInterval ===0) {
    console.warn('Sui_Flip_Coin_Interval is not a number. Defaulting to 7200s ==> 2H');
    flipCoinInterval = 7200;
}

if (isNaN(flip_Coin_Amount)) {
    console.warn('flip_Coin_Amount is not a number. Defaulting to 1SUI');
    flip_Coin_Amount = 1;
}

async function main() {
    const suiMnemonic = new SuiMnemonic(mnemonic);
    console.log("rpc:", rpc)

// Construct your connection:
    const connection = new Connection({
        fullnode: rpc,
    });

    console.log("mnemonicIndex:", mnemonicIndex)
// connect to a custom RPC server
    const provider = new JsonRpcProvider(connection);

    if (userAccountType === "mnemonic") {
        const account = suiMnemonic.getAccount(mnemonicIndex)
        run2048(provider, account)
    } else {
        // 私钥
        const filePath = path.resolve(__dirname, 'account.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const accountData = JSON.parse(fileContent);

        for (let account of accountData) {
            if ('private_key' in account && 'objectId' in account) {
                if (account.private_key) {
                    // console.log("private_key:", account.private_key)
                    let privateKeyHex = account.private_key;
                    if (privateKeyHex.startsWith('0x')) {
                        privateKeyHex = privateKeyHex.slice(2);
                    }
                    const privateKeyBase64 = Buffer.from(privateKeyHex, 'hex').toString('base64');
                    if (privateKeyBase64.length !== 44) {
                        console.log('The private_key is not the correct size. %s', privateKeyBase64.length);
                    } else {
                        const _account = Ed25519Keypair.fromSecretKey(fromB64(privateKeyBase64));
                        run2048(provider, _account)

                    }
                } else {
                    console.log('The private_key field is empty.');
                }
            } else {
                console.error('The object does not have the required properties. %s', account);
            }
        }
    }
}

type Grid = number[][];
type FlatGrid = number[];

async function runFlipCoin(provider: JsonRpcProvider,
                           account: Ed25519Keypair) {
    if (SwitchSUIFlipCoin === true) {
        while(true){
            console.log("start [game flip coin]")
            const coinFlip = new SuiCoinFlip(provider)
            const randomZeroOrOne = Math.floor(Math.random() * 2);

            let choice = ""
            if (randomZeroOrOne === 0) {
                choice = "heads"
            } else {
                choice = "tails"
            }

            await coinFlip.start(account, choice, flip_Coin_Amount)
            const timeout = getRandomNumber(flipCoinInterval, flipCoinInterval+10)
            console.log("delay:", timeout)
            await sleep(timeout)
        }
    } else {
        console.warn("paused flip coin game")
    }
}

async function run2048(provider: JsonRpcProvider, account: Ed25519Keypair) {
    if (SwitchSui8129 === true) {
        while (true) {
            console.log("start game sui8192 for %s account", account.getPublicKey().toSuiAddress())

            const objects =await provider.multiGetObjects({
                ids: [SUI8192ObjectId],
                options: {
                    showContent: true,
                }})


            if (objects.length == 0) {
                console.log("not exist sui log")
                return
            }

            const sui8192 = new Sui8192(provider, SUI8192ObjectId);
            const score = objects[0].data.content["fields"]["score"]
            if (objects[0].data.content["fields"]["active_board"]["fields"]["game_over"] === true) {
                console.log("game over! auto create new round")
                console.log("__dirname", __dirname)
                SUI8192ObjectId = await sui8192.createGame(account);
                if (SUI8192ObjectId === "") {
                    console.error("created a new sui 8192 for %s account", account.getPublicKey().toSuiAddress())
                    continue
                }

                process.env['SUI8192_ObjectId'] = SUI8192ObjectId;
                const envFileContent = Object.entries(process.env)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n');

                const envFilePath = path.join(__dirname, './.env');
                fs.writeFileSync(envFilePath, envFileContent);
                continue
            }

            // return
            let slideDirection = 0
            if (objects[0].data.content["fields"]["active_board"] != undefined) {
                const flatGrid = parsedBoard(objects[0].data.content["fields"]["active_board"]["fields"])
                let grid = flattenTo2DGrid(flatGrid);

                const manager = new Manager(4);
                manager.pointCells(grid);

                manager.pointScore(score);
                const best = manager.getBest();
                // console.log("best:", best.move)
                slideDirection= resetDirection(best.move)
                console.log("slideDirection for %s account:", slideDirection, account.getPublicKey().toSuiAddress())
            }
            const timeout = getRandomNumber(2, 10)
            console.log("delay for %s account:", timeout, account.getPublicKey().toSuiAddress())

            await sleep(timeout)
            await sui8192.game8192(account, slideDirection)
        }
    } else {
        console.warn("paused sui8192 game")
    }
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function resetDirection(aiMove: string): number {
    switch (aiMove) {
        case '0':
            console.log(" ⬆️")
            return 2;
        case '1':
            console.log(" ➡️")
            return 1; // Slide Right
        case '2':
            console.log(" ⬇️")
            return 3;
        case '3':
            console.log(" ⬅️")
            return 0;
    }
}

function flattenTo2DGrid(flatGrid: FlatGrid): Grid {
    let grid: Grid = [];
    for(let i = 0; i < 4; i++) {
        grid[i] = [];
        for(let j = 0; j < 4; j++) {
            grid[i][j] = flatGrid[i*4 + j];
        }
    }
    return grid;
}

function getRandomNumber(min: number, max: number): number {
    return (Math.floor(Math.random() * (max - min) + min)) *1000;
}

function parsedBoard(board): FlatGrid {
    const spaceAt = (packedSpaces, row, column) =>
        Number((BigInt(packedSpaces) >> BigInt((row * COLUMNS + column) * ROWS)) & BigInt(0xF));

    const packedSpaces  = board["packed_spaces"];
    let blocks: FlatGrid = [];
    let topTile = 1;
    for (let i=0; i<ROWS; ++i) {
        for (let j=0; j<COLUMNS; ++j) {
            const tile = spaceAt(packedSpaces, i, j);
            if (tile > topTile) {
                topTile = tile;
            }
            if (tile === 0) {
                // console.log(0)
                blocks.push(0);
            } else {
                blocks.push(Math.pow(2, tile));
            }
        }
    }
    return blocks
}

main()