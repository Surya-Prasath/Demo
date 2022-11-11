//@ts-nocheck
import React from "react";
import "../App.css";
import { create, CID, IPFSHTTPClient } from "ipfs-http-client";
import * as LitJsSdk from "lit-js-sdk";
import { HealthCare, contractAddress, ethers} from "../utils/contract";

//Infura
const projectId = '2BTrbaxBJYvy9HmXgKwJz7CXzRw';
const projectSecret = '6749ca1285e40bc118d22c1527941831';
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

// lit protocol
const client = new LitJsSdk.LitNodeClient();

const chain = "mumbai"


function Sender() {
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
  const encrypt = async(file: File, title, authorizedPerson)=>{
    console.log("-----encrypting-----")
    console.log(typeof(authorizedPerson), "param2")
    const accessControlConditions = [
      {
        contractAddress: contractAddress,
        standardContractType: "",
        chain: chain,
        method: "verify",
        parameters: [String(title), String(authorizedPerson)],
        returnValueTest: {
          comparator: "=",
          value: "true"
        }
      }
    ]

    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const {encryptedFile, symmetricKey} = await LitJsSdk.encryptFile({file})
    // console.warn(symmetricKey, "Symmetric Key")
    // console.log(encryptedFile, "Encrypted File")
    
    // console.log(accessControlConditions, "Access Control Conditions")

    const encryptedSymmetricKey = await client.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain
  });
    // console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")
    
    // Convertion of Uint8Array to String for better retrieval
    const encryptedSymmetricKeyToString = LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    console.log(encryptedSymmetricKeyToString, "encryptedSymmetricKeyToString")
    
    return {encryptedFile:encryptedFile, encryptedSymmetricKey:encryptedSymmetricKeyToString}
  }

  /**
   * @description event handler that uploads the file selected by the user
   */
  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const files = (form[3] as HTMLInputElement).files;

    if (!files || files.length === 0) {
      return alert("No files selected");
    }

    const file = files[0];
    const title = form[0].value.toString()
    const description = form[1].value.toString()
    const authorizedPerson = form[2].value.toString()

    const {encryptedFile, encryptedSymmetricKey} = await encrypt(file, title, authorizedPerson)
    // console.log(encryptedFile, "Encrypted File")
    
    var location = (await uploadToIpfs(encryptedFile)).path
    location = "https://healthcare.infura-ipfs.io/ipfs/" + location
    // console.log(location, "location")

    const metadata = await (ipfs as IPFSHTTPClient).add(JSON.stringify({
        title: title,
        description: description,
        location: location,
        key: encryptedSymmetricKey
    }))
    location = "https://healthcare.infura-ipfs.io/ipfs/"+metadata.path

    await HealthCare.addPath(title, location, authorizedPerson, {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(async()=>{
        await HealthCare.analysisInfo(form[0].value.toString(), 0).then(console.log)
        await HealthCare.authorizedPerson(form[0].value.toString()).then(console.log)
    }
    )
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

  const encryptWithMetadata = async (file)=>{
    console.log("-----encrypting-with-metadata-----")
  
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain})

    const {zipBlob, encryptedSymmetricKey} = await LitJsSdk.encryptFileAndZipWithMetadata({authSig, accessControlConditions, chain, file, litNodeClient, description})
    console.log(zipBlob, "Encrypted File")
    console.log(encryptedSymmetricKey, "Encrypted Symmetric Key")

    return {encryptedFile: zipBlob, encryptedSymmetricKey: encryptedSymmetricKey}
  }

  return (
      <div className="App">
        <header className="App-header">
          {ipfs && (
              <>
                <p>Upload File</p>

                <form onSubmit={onSubmitHandler}>
                  <input type={"text"} placeholder={"title"} />
                  <input type={"text"} placeholder={"description"} /> 
                  <input type={"text" }placeholder="authorizedPerson"/>
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

export default Sender;