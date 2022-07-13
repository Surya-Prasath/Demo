//@ts-nocheck
import {ethers} from "ethers";
import React from "react";
import "./App.css";
import { create, CID, IPFSHTTPClient } from "ipfs-http-client";

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
const contractAddress = "0x705AA8A30F9aD6EdA4d230Fc4E4F39F48AA01E3e"
const abi = [
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
        "name": "numpy",
        "type": "string"
      }
    ],
    "name": "analysed",
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
      }
    ],
    "name": "analysing",
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
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "path",
        "type": "string"
      }
    ],
    "name": "newAnalysis",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

function App() {
  const [images, setImages] = React.useState<{ cid: CID; path: string }[]>([]);
  const [title, setTitle] = React.useState("title")
  const [numpy, setNumpy] = React.useState("")

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

  let ipfs: IPFSHTTPClient | undefined;
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
    // upload files
    const result = await (ipfs as IPFSHTTPClient).add(file);
    const pack = await(ipfs as IPFSHTTPClient).add(JSON.stringify({title: form[0].value, path: "https://ipfs.infura.io/ipfs/"+result.path, desc: form[1].value}))

    console.log("pack", pack)
    console.log("upload on-chain")
    await HealthCare.newAnalysis(form[0].value.toString(), "https://ipfs.infura.io/ipfs/"+pack.path.toString(), {gasPrice: ethers.utils.parseUnits("35", "gwei")}).then(console.log)

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

    form.reset();
  };

  console.log("images ", images);

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
                          src={"https://ipfs.infura.io/ipfs/" + image.path}
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