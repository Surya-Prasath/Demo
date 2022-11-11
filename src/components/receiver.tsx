//@ts-nocheck
import React from "react";
import "../App.css";
import { HealthCare, contractAddress, publicKey} 
from "../utils/contract";
import { create, IPFSHTTPClient } from "ipfs-http-client";
import * as LitJsSdk from "lit-js-sdk";


//Infura
const projectId = '2BTrbaxBJYvy9HmXgKwJz7CXzRw';
const projectSecret = '6749ca1285e40bc118d22c1527941831';
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

// lit protocol
const client = new LitJsSdk.LitNodeClient();
const chain = "mumbai"


function Receiver() {
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

  /**
 * @description This decrypts the File
 */
  const decrypt = async(encryptedFile, encryptedSymmetricKey, title)=>{
    console.log("-----decrypting-----")
    var sender = null;
    if (typeof window.ethereum !== 'undefined') {
      // connects to MetaMask
      sender = await ethereum.request({ method: 'eth_requestAccounts' });
      // console.log(accounts, "Account")
    } else{
      console.log("Try installing and connecting metamask to this site.")
    }
    console.log(typeof(sender[0]), "param2")
    const accessControlConditions = [
      {
        contractAddress: contractAddress,
        standardContractType: "",
        chain: chain,
        method: "verify",
        parameters: [String(title), String(sender[0])],
        returnValueTest: {
          comparator: "=",
          value: "true"
        }
      }
    ]

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})


    // const toDecrypt = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16')
    // console.log(toDecrypt, "Encrypted Symmetric Key String")
    console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt: encryptedSymmetricKey,
        chain,
        authSig
    })
    console.log(_symmetricKey, "Symmetric Key")
    // console.log(accessControlConditions, "Access Control Conditions")
    const file = await LitJsSdk.decryptFile({file: encryptedFile, symmetricKey: _symmetricKey})
    // console.log(file, "Decrypted File")

    return file
  }

  const readUrl = async (url) => {
    console.log("-----reading-url-----")

    const metadata = await (await fetch(url)).json()
    const encryptedFile = await(await fetch(metadata["location"])).blob()
    
    // console.log(encryptedFile)

    const originalFile = await decrypt(encryptedFile, metadata["key"], metadata["title"])

    window.open(URL.createObjectURL(new Blob(originalFile), {type: "image/jpg"}))
  }

  /**
   * @description event handler that uploads the file selected by the user
   */

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();


    const form = event.target as HTMLFormElement;
    const title = form[0].value.toString()
    const location = await HealthCare.analysisInfo(title, 0)
    console.log(location, "Location")
    await readUrl(location)
    form.reset();
  };



   /**
   * @description Extra options
   */
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
    // console.log(_symmetricKey, "Symmetric Key")

    const file = await LitJsSdk.decryptZip(encryptedFile, _symmetricKey)
    // console.log(file, "Decrypted File")

    return file
  }

  const decryptWithMetadata = async ()=>{
    console.log("-----decrypting-with-metadata-----")

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const toDecrypt = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');
    // console.log(toDecrypt, "Encrypted Symmetric Key String")

    // <Uint8Array(32)> _symmetricKey 
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    })
    // console.log(_symmetricKey, "Symmetric Key")

    await LitJsSdk.decryptZipFileWithMetadata({authSig, file: encryptedFile, litNodeClient: client}).then(hi=>console.log)
    // console.log(file, "Decrypted File")

    // return file
  }

  return (
      <div className="App">
        <header className="App-header">
          {ipfs && (
              <>
                <p>Download File</p>

                <form onSubmit={onSubmitHandler}>
                  <input type={"text"} placeholder={"title"} />
                  <input type={"text"} placeholder={"data"} />
                  <button type="submit">Download File</button>
                </form>
              </>
          )}
          

          {!ipfs && (
              <p>Oh oh, Not connected to IPFS. Checkout out the logs for errors</p>
          )}
        </header>
      </div>
  );
}

export default Receiver;