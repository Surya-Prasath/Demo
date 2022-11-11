//@ts-nocheck
import {ethers} from "ethers";
import React from "react";
import "./App.css";
import { create, CID, IPFSHTTPClient } from "ipfs-http-client";
import * as LitJsSdk from "lit-js-sdk";

//Wallet
const privateKey = "9d8503bdda5043ff1d25307c27a28b0e221b05bfa4c6da134935c3eefaa21212"

//Alchemy
const apiKey = "qaOYDNV2ngCyjlxBL-k13lXXn4c6Ty44"
// const apiUrl = "https://polygon-mumbai.g.alchemy.com/v2/qaOYDNV2ngCyjlxBL-k13lXXn4c6Ty44";

//Infura
const projectId = '2BTrbaxBJYvy9HmXgKwJz7CXzRw';
const projectSecret = '6749ca1285e40bc118d22c1527941831';
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

//Contract
const contractAddress = "0xEe3F106fB65951Be5cF70af195c0a6f65DdBf5Ee"
const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "info",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "path",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "key",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "addAnalysis",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
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

// lit protocol
const client = new LitJsSdk.LitNodeClient();
const chain = "mumbai"


function App() {
  client.connect()
  window.litNodeClient = client

  var ipfs: IPFSHTTPClient | undefined;
  try {
    ipfs = create({
      url: "https://ipfs.infura.io:5001/api/v0",
      headers: {
        authorization,
      },
    });
  } catch (error) {
    console.error("IPFS error ", error);
    ipfs = undefined;
  }

  const [images, setImages] = React.useState<{ cid: CID; path: string }[]>([]);
  const [title, setTitle] = React.useState("title")
  const [numpy, setNumpy] = React.useState("")
  const [fileToDecrypt, setFileToDecrypt] = React.useState("")


  // Provider
    const alchemyProvider = new ethers.providers.AlchemyProvider("maticmum", apiKey);

  // Signer
    const signer = new ethers.Wallet(privateKey, alchemyProvider);

  // Contract
    const HealthCare = new ethers.Contract(contractAddress, abi, signer);

  function set_title(event){
    setTitle(event.target.value.toString())
  }

  function set_numpy(event){
    setNumpy(event.target.value)
  }

  const analysing = async ()=>{
    alchemyProvider.getTransactionCount().then(console.log)
    console.log("analysing")
    await HealthCare.analysing(title, {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(console.log)
  }
  const analysed = async ()=>{
    console.log("analysed")
    await HealthCare.analysed(title, numpy, {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(console.log)
  }

/**
 * @description uploads the encrypted file to the ipfs
 */
  const uploadToIpfs = async (file: File)=>{
    console.log("-----uploading-to-ipfs-----")

    const result = await (ipfs as IPFSHTTPClient).add(file);

    const uniquePaths = new Set([
      ...images.map((image) => image.path),
      result.path,
    ]);

    const uniqueImages = [...uniquePaths.values()]
        .map((path) => {
          return [
            ...images,
            {
              cid: result.cid,
              path: result.path,
            },
          ].find((image) => image.path === path);
        });

    // @ts-ignore
    setImages(uniqueImages);

    return result
  }

/**
 * @description This encrypts the File
 */
  const encrypt = async(file: File, title)=>{

    const accessControlConditions = [
      {
        contractAddress: contractAddress,
        standardContractType: "",
        chain: chain,
        method: "verify",
        parameters: [title],
        returnValueTest: {
          comparator: "=",
          value: "true"
        }
      }
    ]

    console.log("-----encrypting-----")
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const {encryptedFile, symmetricKey} = await LitJsSdk.encryptFile({file})
    console.log(symmetricKey, "Symmetric Key")
    console.log(encryptedFile, "Encrypted File")

    const encryptedSymmetricKey = await client.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
      permanent: false
  });
    console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")

    return {encryptedFile:encryptedFile, encryptedSymmetricKey:encryptedSymmetricKey}
 
    return file
  }

  const addViewers = async ()=>{

  }

 /**
 * @description This decrypts the File
 */
  const decrypt = async(encryptedFile, encryptedSymmetricKey, title)=>{

    const accessControlConditions = [
      {
        contractAddress: contractAddress,
        standardContractType: "",
        chain: chain,
        method: "verify",
        parameters: ["surya"],
        returnValueTest: {
          comparator: "=",
          value: "true"
        }
      }
    ]

    console.log("-----decrypting-----")
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const toDecrypt = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');
    console.log(toDecrypt, "Encrypted Symmetric Key String")

    
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    })
    console.log(_symmetricKey, "Symmetric Key")

    const file = await LitJsSdk.decryptFile({file: encryptedFile, symmetricKey: _symmetricKey})
    console.log(file, "Decrypted File")
  }

  const readUrl = (url) => {
    console.log("-----reading-url-----")

    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob"
    xhr.onload = (event)=>{
      setFileToDecrypt(()=>xhr.response)
      console.log(fileToDecrypt, "File to Decrypt")
    }
    xhr.open("GET", url)
    xhr.send(null)
  }

  /**
   * @description event handler that uploads the file selected by the user
   */

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const files = (form[2] as HTMLInputElement).files;

    if (!files || files.length === 0) {
      return alert("No files selected");
    }

    const file = files[0];

    const {encryptedFile, encryptedSymmetricKey} = await encrypt(file, form[0].value.toString())  
    console.log(encryptedFile, "Encrypted File")
    
    var location = (await uploadToIpfs(file)).path
    location = "https://healthcare.infura-ipfs.io/ipfs/" + location
    console.log(location, "location")
    
    await HealthCare.addAnalysis(form[0].value.toString(), form[1].value.toString(), location.toString(), encryptedSymmetricKey.toString(), "0x577D412b4Bc042A37Ba0fb36888485047295dd84", {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(console.log)

    // readUrl(location)
    // console.log(fileToDecrypt, "File to Decrypt")


    await decrypt(encryptedFile, enSymKey, form[0].value.toString()).then((originalFile)=>window.open(URL.createObjectURL(new Blob([originalFile], {type: "image/jpg"}))))   
  

     // const pack = await(ipfs as IPFSHTTPClient).add(JSON.stringify({title: form[0].value, path: "https://healthcare.infura-ipfs.io/ipfs/"+result.path, desc: form[1].value}))
    // console.log("pack", pack)
    // await HealthCare.newAnalysis(form[0].value.toString(), "https://healthcare.infura-ipfs.io/ipfs/"+pack.path.toString(), {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(console.log)

    form.reset();
  };

  console.log("images ", images);

   /**
   * @description Extra options
   */

  const encryptZip = async (files)=>{
    console.log("-----encrypting-zip-----")
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const {symmetricKey, encryptedZip} = await LitJsSdk.zipAndEncryptFiles(file)
    console.log(symmetricKey, "Symmetric Key")
    console.log(encryptedZip, "Encrypted Zip")

    const encryptedSymmetricKey = await client.saveEncryptionKey({accessControlConditions, chain, authSig, symmetricKey, False})
    console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")

    return {encryptedZip:encryptedZip, encryptedSymmetricKey:encryptedSymmetricKey}
  }

  const decryptZip = async(encryptedFile, encryptedSymmetricKey)=>{
    console.log("-----decrypting-----")
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const toDecrypt = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');
    console.log(toDecrypt, "Encrypted Symmetric Key String")

    // <Uint8Array(32)> _symmetricKey 
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    })
    console.log(_symmetricKey, "Symmetric Key")

    const file = await LitJsSdk.decryptZip(encryptedFile, _symmetricKey)
    console.log(file, "Decrypted File")

    return file
  }

  const encryptWithMetadata = async (file)=>{
    console.log("-----encrypting-with-metadata-----")
  
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const {zipBlob, encryptedSymmetricKey} = await LitJsSdk.encryptFileAndZipWithMetadata({authSig, accessControlConditions, chain, file, litNodeClient, description})
    console.log(zipBlob, "Encrypted File")
    console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")

    return {encryptedFile: zipBlob, encryptedSymmetricKey: encryptedSymmetricKey}

  }

  const decryptWithMetadata = async ()=>{
    console.log("-----decrypting-with-metadata-----")

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const toDecrypt = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');
    console.log(toDecrypt, "Encrypted Symmetric Key String")

    // <Uint8Array(32)> _symmetricKey 
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    })
    console.log(_symmetricKey, "Symmetric Key")

    await LitJsSdk.decryptZipFileWithMetadata({authSig, file: encryptedFile, litNodeClient: client}).then(hi=>console.log)
    // console.log(file, "Decrypted File")

    // return file
  }

  return (
      <div className="App">
        <header className="App-header">
          {ipfs && (
              <>
                <input onChange={set_title} placeholder={"title"} />
                <input onChange={set_numpy} placeholder={"numpy"} />
                <button onClick={analysing}>Analysing</button>
                <button onClick={analysed}>Analysed</button>
                
                <p>Upload File using IPFS</p>

                <form onSubmit={onSubmitHandler}>
                  <input name={"title"} type={"text"} placeholder={"title"} />
                  <input name={"desc"} type={"text"} placeholder={"description"} />
                  <input name="file" type="file" />
                  <button type="submit">Upload File</button>
                </form>

                <div>
                  {images.map((image, index) => (
                      <img
                          alt={`Uploaded #${index + 1}`}
                          src={"https://healthcare.infura-ipfs.io/ipfs/" + image.path}
                          style={{ maxWidth: "400px", margin: "15px" }}
                          key={image.cid.toString() + index}
                      />
                  ))}
                </div>
              </>
          )}
          

          {!ipfs && (
              <p>Oh oh, Not connected to IPFS. Checkout out the logs for errors</p>
          )}
        </header>
      </div>
  );
}

export default App;