import React, { useState } from "react"

import { db } from "../../Firebase/FirebaseInit"
import { doc, setDoc } from "firebase/firestore";

import MyAlgo from '@randlabs/myalgo-connect';

import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";

import { Button, Typography } from "@mui/material"

export default function AlgoConnect(props) {

  
    const myAlgoWallet = new MyAlgo()

    const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        qrcodeModal: QRCodeModal,
      });

    const connectToMyAlgo = async() => {
        try {

        const accounts = await myAlgoWallet.connect();
    
        const addresses = accounts.map(account => account.address);

        await setDoc(doc(db, "wallets", addresses[0]), {
            walletType: "MyAlgo"
          }, {merge: true}).then(
            props.setActiveAddress(addresses[0])
          )

       

        
        
        } catch (err) {
        console.error(err);
        }
    }

    const connectToAlgoWallet = async() => {
        try {

            if (!connector.connected) {
                // create new session
                connector.createSession();
              }
            else {
                console.log(connector)
                await setDoc(doc(db, "wallets", connector.accounts[0]), {
                    walletType: "Pera"
                    }, {merge: true}).then(
                    props.setActiveAddress(connector.accounts[0])
                    )
            }
              
              // Subscribe to connection events
              connector.on("connect", async (error, payload) => {
                if (error) {
                  throw error;
                }
              
                // Get provided accounts
                const { accounts } = payload.params[0];
                console.log(accounts[0])

                await setDoc(doc(db, "wallets", accounts[0]), {
                    walletType: "Official"
                    }, {merge: true}).then(
                    props.setActiveAddress(accounts[0])
                    )
            

              });

        

        
        
        } catch (err) {
        console.error(err);
        }
    }

    const disconnect = () => {
        props.setActiveAddress(null)
    }

    return (
        <div >
            {props.activeAddress ? 
            <Button 
                color="primary" 
                style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}
                onClick={() => disconnect()}
            > 
            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> {props.activeAddress.slice(0, 10)} </Typography>
            </Button>
            :
            <>
            <Button 
                color="primary" 
                style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}
                onClick={() => connectToAlgoWallet()}
                > 
                <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Pera </Typography>
            </Button>
            <br />
            <Button 
                color="primary" 
                style={{display: "flex", margin: "auto"}}
                onClick={() => connectToMyAlgo()}
                > 
                <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> MyAlgo </Typography>
            </Button>
            </>
            
            }
        </div>
    )
}

