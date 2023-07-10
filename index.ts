import * as dotenv from 'dotenv';

import {SuiMnemonic} from "./src/accounts/mnemonic";
import  {SuiTool} from "./src/suiclient/sui";
import {Polymedia} from "./src/polymedia/polymedia";
import {JsonRpcProvider, Connection, Ed25519Keypair} from '@mysten/sui.js';
import {Sui8192} from "./src/sui8192/sui8192";
import {ObjectId, SuiObjectDataOptions} from "@mysten/sui.js/src/types";

const ROWS = 4;
const COLUMNS = 4;

dotenv.config();
const mnemonic = process.env.MNEMONIC || "";
let rpc = process.env.RPC || "";
const mnemonicIndex = Number(process.env.MNEMONIC_INDEX) || 0;
const SUI8192ObjectId = process.env.SUI8192_ObjectId

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
    const account = suiMnemonic.getAccount(mnemonicIndex)

    await run2048(provider, account)
}

type Grid = number[][];
type FlatGrid = number[];

async function run2048(provider: JsonRpcProvider, account: Ed25519Keypair) {
    while (true) {
        const objects =await provider.multiGetObjects({
            ids: [SUI8192ObjectId],
            options: {
                showContent: true,
            }})


        if (objects.length == 0) {
            console.log("not exist sui log")
            return
        }

        // if (objects[0].data.content["fields"]["active_board"]["fields"]["game_over"] === true) {
        //     console.log("game over, plz create new round")
        //     return
        // }

        // console.log("aaaa", objects[0].data.content)
        // return
        let slideDirection = 0
        if (objects[0].data.content["fields"]["active_board"] != undefined) {
            const flatGrid = parsedBoard(objects[0].data.content["fields"]["active_board"]["fields"])
            slideDirection = getSlideDirection(flatGrid);
        }

        console.log("SUI8192ObjectId:", SUI8192ObjectId)

        const timeout = getRandomNumber(2, 10)
        console.log("timeout:", timeout)

        await delay(timeout)
        const sui8192 = new Sui8192(provider, SUI8192ObjectId);
        await sui8192.game8192(account, slideDirection)
    }
}


function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getSlideDirection(flatGrid: FlatGrid): number {
    let grid = flattenTo2DGrid(flatGrid);

    if(canSlideUp(grid)) {
        console.log(" ⬆️")
        return 2; // Slide Up
    } else if(canSlideLeft(grid)) {
        console.log(" ⬅️")
        return 0; // Slide Left
    } else if(canSlideRight(grid)) {
        console.log(" ➡️")
        return 1; // Slide Right
    } else if(canSlideDown(grid)) {
        console.log(" ⬇️")
        return 3; // Slide Down
    } else {
        throw new Error("No valid moves left");
    }
}

function canSlideUp(grid: Grid): boolean {
    for(let col = 0; col < 4; col++) {
        for(let row = 1; row < 4; row++) {
            if(grid[row][col] !== 0 && (grid[row-1][col] === 0 || grid[row-1][col] === grid[row][col])) {
                return true;
            }
        }
    }
    return false;
}

function canSlideLeft(grid: Grid): boolean {
    for(let row = 0; row < 4; row++) {
        for(let col = 1; col < 4; col++) {
            if(grid[row][col] !== 0 && (grid[row][col-1] === 0 || grid[row][col-1] === grid[row][col])) {
                return true;
            }
        }
    }
    return false;
}

function canSlideRight(grid: Grid): boolean {
    for(let row = 0; row < 4; row++) {
        for(let col = 2; col >= 0; col--) {
            if(grid[row][col] !== 0 && (grid[row][col+1] === 0 || grid[row][col+1] === grid[row][col])) {
                return true;
            }
        }
    }
    return false;
}

function canSlideDown(grid: Grid): boolean {
    for(let col = 0; col < 4; col++) {
        for(let row = 2; row >= 0; row--) {
            if(grid[row][col] !== 0 && (grid[row+1][col] === 0 || grid[row+1][col] === grid[row][col])) {
                return true;
            }
        }
    }
    return false;
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