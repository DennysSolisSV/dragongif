import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import dragonLogo from './assets/logo.png';
import './App.css';
import { Connection, PublicKey, clusterApiUrl, Transaction} from '@solana/web3.js';

import {
  Program, Provider, web3,
} from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;
const anchor = require('@project-serum/anchor');
// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const amount = new anchor.BN(25 * 10 ** 6)


// Constants
const TWITTER_HANDLE = 'D3nnsS0l1s';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  

  // Check if wallet is connected.
  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;

      if (solana){
        if (solana.isPhantom){
          console.log("Phantom wallet found!");

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString() 
          );

          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom wallet");
      }
    } catch(error){
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  // send the link to the blockchain
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
    resetInputField();
    
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  // Reset Input Field handler
  const resetInputField = () => {
    setInputValue("");
  };

  const clickGifId = (event) => {
    const { value } = event.target;    
    likeUp(value);   
  };

  const clickSendMoney = (event) => {
    const { value } = event.target;
    sendMoney(value);  
  };


  const likeUp = async (gifId) => {
    
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.likeUp(gifId, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
        signers: [baseAccount],
      });
      
      
      console.log("GIF sucesfully sent like", gifId)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
    
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const sendMoney = async (destPublicKeyStr) => {
    console.log(destPublicKeyStr)
    
    try {
      const destPubKey = new PublicKey(destPublicKeyStr);
      const senderPubKey = new PublicKey(walletAddress);
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.sendSol(amount, {
        accounts: {
          from: senderPubKey,
          to:destPubKey,
          systemProgram: SystemProgram.programId,
        },
      });
      
      console.log("sent money")
  
      await getGifList();
    } catch (error) {
      console.log("Error sending Money:", error)
    }
    
  };

  // const sendMoney = async (destPubkeyStr, lamports) => {
  //   try {
  //     const connection = new Connection(network, opts.preflightCommitment);
  //     console.log("starting sendMoney");
  //     const destPubkey = new PublicKey(destPubkeyStr);
  //     const senderPubKey = new PublicKey(walletAddress);
  //     const walletAccountInfo = await connection.getAccountInfo(
  //       senderPubKey
  //     );
  //     console.log("wallet data size", walletAccountInfo?.data.length);
  
  //     const receiverAccountInfo = await connection.getAccountInfo(destPubkey);
  //     console.log("receiver data size", receiverAccountInfo?.data.length);
  
  //     const instruction = SystemProgram.transfer({
  //       fromPubkey: senderPubKey,
  //       toPubkey: destPubkey,
  //       lamports, // about half a SOL
  //     });
  //     let trans = await setWalletTransaction(senderPubKey, connection, instruction);
  
  //     let signature = await signAndSendTransaction(senderPubKey, connection, trans);
  //     let result = await connection.confirmTransaction(signature, "singleGossip");
  //     console.log("money sent", result);
  //   } catch (e) {
  //     console.warn("Failed", e);
  //   }
  // }

  // const setWalletTransaction = async (senderPubKey, connection, instruction) => {
  //   const transaction = new Transaction();
  //   transaction.add(instruction);
  //   transaction.feePayer = senderPubKey;
  //   let hash = await connection.getRecentBlockhash();
  //   console.log("blockhash", hash);
  //   transaction.recentBlockhash = hash.blockhash;
  //   return transaction;
  // }
  
  // const signAndSendTransaction = async  (senderPubKey, connection, transaction ) => {
  //   let signedTrans = await senderPubKey.signTransaction(transaction);
  //   console.log("sign transaction");
  //   let signature = await connection.sendRawTransaction(signedTrans.serialize());
  //   console.log("send raw transaction");
  //   return signature;
  // }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 

  

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const renderNotConnectedContainer = () => (
    <button
    className="cta-button connect-wallet-button"
    onClick= {connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } 
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return(
        <div className="connected-container">
          <input className="inp"
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
                <p> Sender: {item.userAddress.toString()}</p>
                <div>
                  <button className="cta-button submit-like-button" value={item.gifId.toString()} onClick={clickGifId}>
                    Like  ({item.upVote.toString()})  
                  </button>
                  <button className="cta-button submit-money-button" value={item.userAddress.toString()} onClick={clickSendMoney}>
                    Tip 0.025 Solana 
                  </button>
                </div>
                  
              </div>
            ))}
          </div>
        </div>
      )
    }
  }


  useEffect (() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      
      
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header"><img alt="DragonBall Logo" className="dragon-ball-logo" src={dragonLogo} /></p>
          <p className="sub-text">
            View your Dragon Ball GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
          <div className={walletAddress ? 'authed-container' : 'container'}></div>
        </div>
        <footer>
          <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
