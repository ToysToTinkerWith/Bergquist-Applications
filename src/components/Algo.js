import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import MyAlgo from '@randlabs/myalgo-connect';


import { Typography, Button, Card, Avatar, IconButton, Input } from "@material-ui/core"


const myAlgoWallet = new MyAlgo()

class Algo extends React.Component {
  constructor() {
    super()
    this.state = {
      wallet: null
    }
    this.handleChange = this.handleChange.bind(this)
    this.connectToMyAlgo = this.connectToMyAlgo.bind(this)
    this.disconnectFromMyAlgo = this.disconnectFromMyAlgo.bind(this)
  }

  
  
  async connectToMyAlgo() {

  try {

    console.log(myAlgoWallet)

    const accounts = await myAlgoWallet.connect();

    const addresses = accounts.map(account => account.address);

    this.setState({
        wallet: addresses[0]
    })

    console.log(addresses)
    
  } catch (err) {
    console.error(err);
  }
}

  disconnectFromMyAlgo() {
    this.setState({wallet: null})
  }


   handleChange(event) {

    const {name, value} = event.target

    if (value >= 0) {
      this.setState({[name]: value})
    }

    
  }

  componentDidMount() {

  }


  render() {

      const shopstyle = {
        borderRadius: "15px",
        padding: "10px",
        textAlign: "center"
      }

      const uploadstyle = {
        backgroundColor: "#3F3D56",
        borderRadius: "15px",
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        padding: 10,
        marginBottom: 40
    
      }

      console.log(this.state.exchangeAcorns)

      return (
   
        <div>
            
          
                  
                {this.state.wallet ?
                    <div style={shopstyle}>
                    <Button variant="contained" color="secondary" onClick={() => this.disconnectFromMyAlgo()}>
                        <Avatar variant="square" src="/algorand.svg" alt="Algo" style={{ height: "30px", width: "30px" }} />
                        <Typography variant="caption" > Disconnect </Typography>
                    </Button>
                    <br />
                    <Typography variant="caption"  style={{color: "#E6E6E6"}}> Connected Wallet: {this.state.wallet} </Typography>
                    </div>
                :
                    <div style={shopstyle}>
                        <Button variant="contained" color="secondary" onClick={() => this.connectToMyAlgo()}>
                            <Avatar variant="square" src="/algorand.svg" alt="Algo" style={{ height: "30px", width: "30px" }} />
                            <Typography variant="caption" > Connect </Typography>
                        </Button>                  
                    </div>
                }            
            
          

          
        </div>

       
        )
    
  }
}

export default Algo