import React, { useState, useEffect } from "react"

import MyAlgo from '@randlabs/myalgo-connect';

import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

import { Button, Typography } from "@mui/material"

export default function AlgoConnect(props) {

    useEffect(() => {
        // Reconnect to the session when the component is mounted
        peraWallet.reconnectSession().then((accounts) => {
          // Setup the disconnect event listener

          peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
    
          if (accounts.length) {
            props.setActiveAddress(accounts[0])
            props.setWalletType("pera")
          }
        })
        .catch((error) => {
            // You MUST handle the reject because once the user closes the modal, peraWallet.connect() promise will be rejected.
            // For the async/await syntax you MUST use try/catch
            if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
                // log the necessary errors
            }
            });
      }, []);

    const myAlgoWallet = new MyAlgo()

    const connectToMyAlgo = async() => {
        try {

        const accounts = await myAlgoWallet.connect();
    
        const addresses = accounts.map(account => account.address);

        props.setActiveAddress(addresses[0])
        props.setWalletType("myalgo")
        
        
        } catch (err) {
        console.error(err);
        }
    }


    function handleConnectWalletClick() {


      
        peraWallet
        .connect()
        .then((newAccounts) => {

            props.setActiveAddress(newAccounts[0]);
            props.setWalletType("pera")
        })
        .catch((error) => {
            // You MUST handle the reject because once the user closes the modal, peraWallet.connect() promise will be rejected.
            // For the async/await syntax you MUST use try/catch
            if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
                // log the necessary errors
            }
            });
       
        
      }

    const handleDisconnectWalletClick = () => {
        props.setActiveAddress(null)
        props.setWalletType(null)
    }

    return (
        <div >
            {props.activeAddress ? 
            <>
            <Typography align="center" variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> {props.activeAddress.slice(0, 10)} </Typography>
            <br />
            <Button 
                style={{display: "flex", margin: "auto", padding: 10, borderRadius: 15, backgroundColor: "#E6E6E6"}}
                onClick={() => handleDisconnectWalletClick()}
            > 
            <Typography variant="h6" style={{fontFamily: "Chango"}}> Disconnect </Typography>
            </Button>
            </>
            :
            <>
            <Button 
                
                style={{display: "flex", margin: "auto", padding: 10, borderRadius: 15}}
                onClick={() => handleConnectWalletClick()}
                > 
                <img src="algorand/PeraWallet.svg" alt="Pera" style={{height: 70, border: "1px solid #FCEC54", borderRadius: 15, padding: 10}} />
            </Button>
            <br />
            <Button 
                
                style={{display: "flex", margin: "auto", borderRadius: 15}}
                onClick={() => connectToMyAlgo()}
                > 
                <img src="algorand/MyAlgo.svg" alt="MyAlgo" style={{height: 70, border: "1px solid #245EC6", borderRadius: 15, padding: 10}} />
            </Button>
            </>
            
            }
            <br />
        </div>
    )
}





