import {ethers} from "ethers";

const contractAddress = "0x22A724F5b8F16D1dD090Fc5CD4Fb5dddde625f54"
const contractAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "path",
				"type": "string"
			}
		],
		"name": "addAnalysis",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "path",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "addPath",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "analysisInfo",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "authorizedPerson",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "callingPerson",
				"type": "address"
			}
		],
		"name": "verify",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const privateKey = "9d8503bdda5043ff1d25307c27a28b0e221b05bfa4c6da134935c3eefaa21212"
const publicKey = "0xc1829a7c7fFC32e530DD38e190D383c23eAf3367"

//Alchemy
const apiKey = "qaOYDNV2ngCyjlxBL-k13lXXn4c6Ty44"
// const apiUrl = "https://polygon-mumbai.g.alchemy.com/v2/qaOYDNV2ngCyjlxBL-k13lXXn4c6Ty44";

// Provider
const alchemyProvider = new ethers.providers.AlchemyProvider("maticmum", apiKey);

// Signer
const signer = new ethers.Wallet(privateKey, alchemyProvider);

// Contract
const HealthCare = new ethers.Contract(contractAddress, contractAbi, signer);

export {HealthCare, contractAddress, publicKey,  ethers};