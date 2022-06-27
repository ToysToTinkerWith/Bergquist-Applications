import React from "react"

import { db } from "../../Firebase/FirebaseInit"
import { doc, collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"

import Proposals from "../components/Proposals"

import { Button, Typography, Modal, TextField } from "@mui/material"


export default class Wallet extends React.Component {

    constructor() {
        super()
        this.state = {
            wallet: null,
            proposal: ""

        }
        this.sendProposal = this.sendProposal.bind(this)
        this.deleteProposal = this.deleteProposal.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }


  componentDidMount() {

    const walletRef = doc(db, "wallets", this.props.walletId)

    this.unsub = onSnapshot(walletRef, (wallet) => {
        this.setState({
          wallet: wallet.data()
        })
    })

  }

  componentWillUnmount() {
    this.unsub()
  }

  async sendProposal() {

    const walletRef = doc(db, "wallets", this.props.walletId)

    await updateDoc(walletRef, {
        proposal: this.state.proposal
    })

  }

  async deleteProposal() {
    
    const walletRef = doc(db, "wallets", this.props.walletId)

    await updateDoc(walletRef, {
        proposal: ""
    })

  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
    [name]: value

    });
  }

  render() {

    if (this.state.wallet) {

        return (
          <div >
        
              <div style={{backgroundColor: "#3F3D56"}}>

                {this.state.wallet.proposal ? 
                <>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> Proposal </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> {this.state.wallet.proposal} </Typography>
                    <Button onClick={() => this.deleteProposal()} style={{display: "flex", margin: "auto", backgroundColor: "#FF6584", padding: 10, borderRadius: 15, marginTop: 0}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Change Proposal </Typography>
                    </Button>
                    <br />
                    <br />
                </>
                :
                <>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> Submit a proposal for an update to Bergquist Applications </Typography>

                    <TextField
                        color="primary"
                        variant="outlined"
                        multiline
                        rows={5}
                        value={this.state.proposal}
                        type="text"
                        label={<Typography variant="body1" style={{fontFamily: "Chango", color: "#FFFFFF"}}> Proposal </Typography>}
                        name={"proposal"}
                        inputProps={{ style: { color: "white", fontFamily: "Chango" }}}

                        sx={{"& .MuiOutlinedInput-root":{"& > fieldset": {border: '2px solid #E6E6E6'}}}}
                        style={{width: "80%", display: "flex", margin: "auto"}}
                        onChange={this.handleChange}
                        />
                        
                    <Button onClick={() => this.sendProposal()} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15, marginTop: "2%"}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Propose </Typography>
                            </Button>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> or vote on an existing measure </Typography>
                </>}

              </div>
            
            <br />

            <Proposals addresses={this.props.addresses} walletId={this.props.walletId} />
    
          </div>
        )
      }
    
      else {
        return (
          <div>
                <Typography variant="h4" > {this.props.walletId} </Typography>

          </div>
        )
      }
  }
  

      
  }
    
