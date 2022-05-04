import {Contract, provider, utils} from "ethers";
import Head from 'next/head'
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {abi, NFT_CONTRACT_ADDRESS} from "../constants";
import styles from '../styles/Home.module.css';

export default function Home() {
  // Keep track if user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // Keep track if presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);
  // Keep track if presaleEnded has ended or not
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when waiting for a transaction.
  const [loading, setLoading] = useState(false);
  // Check if connected wallet is owner of the contract
  const [isOwner,setIsOwner] = useState(false);
  // Keep track of tokenIds that have been minted.
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a reference to the web3 modal which persists as long as page is opened.
  const web3ModalRef = useRef();

  /**
   * Mint an NFT during the presale - presaleMint
  */
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // create a new Contract instance with signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the presaleMint function to aloow only whitelisted addresses mint NFTs
      const tx = await whitelistContract.presaleMint({
        // Value signifies the cost of one Mave Dev NFT - 0.01ETH
        value: utils.parseEther("0.008"),
      });
      setLoading(true);
      // Wait for transaction to get mined
      await tx.wait(true);
      setLoading(false);
      window.alert("Congrats, you have successfully minted a Mave Dev NFT!")
    } catch (err) {
      console.error(err)
    };
  };
  /**
   * Mint an NFT after the presale.
  */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Create a new Contract instance
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Call the mint from the contract to mint the Mave Dev NFT
      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      //  wait for the transcaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Congrats, you have successfully minted a Mave Dev NFT!")
    } catch (err) {
      console.error(err)
    };
  };

  // Connect the user's wallet
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal and prompt user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    };
  };

  // Start the presale of Mave Dev NFTs collection
  const startPresale = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true)
      // Create a new Contract instance
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      // Wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // Set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err)
    };
  };
  
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal since I want to read the state from the blockchain
      const provider = await getProviderOrSigner();
      // Connect the contract with a provider to get read-only access to the contract.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted)
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    };
  }

  // Check if the presale has ended by querying the presaleEnded variable
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal since I want to read the state from the blockchain
      const provider = await getProviderOrSigner();
      // Connect the contract with a provider to get read-only access to the contract.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _presaleEnded = await nftContract.presaleEnded();
      // Check if the _presaleEnded timestamp is less than the current time which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded){
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Get the owner of the contract - getOwner
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal since I want to read the state from the blockchain
      const provider = await getProviderOrSigner();
      // Connect the contract with a provider to get read-only access to the contract.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // Retrieve the address of the currently connected wallet with signer
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer that is connected to the wallet
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Get the number of tokenIds that have been minted
  const getTokenIdsMinted = async () => {
    try{
      // Get the provider from web3Modal since I want to read the state from the blockchain
      const provider = await getProviderOrSigner();
      // Connect the contract with a provider to get read-only access to the contract.
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      // convert tokenIds fromBig Number to string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err){
      console.error(err)
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect Metamask or other ethereum wallet
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // Prompt user to switch to Rinkeby network if not connected with Rinkeby
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please change your network to Rinkeby.");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  useEffect(() => {
    // if !walletConnected, create a new instance of Web3Modal and connect wallet
    if (!walletConnected){
      // The 'current' value is peresisted throughout as long as page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // Check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded
      }
      getTokenIdsMinted();

      // Set interval to check if presale has ended every 5s
      const presaleEndedInterval = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000)
    }
  }, [walletConnected]);

  // Create render button to for the state of the dapp
  const renderButton = () => {
    // If !walletConnected, return a button which allows users connect to dapp
    if(!walletConnected) {
      return (
        <button onClick={walletConnected} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
    // Return loading button when waiting for something
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner and presale hasn't started, allow them to start presale
    if(isOwner && !presaleStarted){
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      )
    }

    // If connected user is not the owner but presale hasn't started yet, return a message
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn&apos;t started!</div>
        </div>
      );
    }

    // Allow users to mint NFTs if presale has started but has not ended.
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! Mint a Mave Dev NFT if your address is whitelisted.
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // Allow users publicly mint NFTs if presaleStarted && presaleEnded
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>Mave Devs NFT Collection</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1>Welcome to Mave Devs NFT Collection!</h1>
          <div>
            It&apos;s an NFT collection for Mave Devs customers.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./mavedevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with&nbsp;<span>&#10084;</span>&nbsp;by&nbsp;<a href="https://www.github.com/ikenwaa" target="_blank" rel="noreferrer">Augustine Ikenwa</a>
      </footer>
    </div>
  );
};
