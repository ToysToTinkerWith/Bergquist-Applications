import React from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { doc, collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"

import Proposals from "./Proposals"

import { Button, Typography, Modal, TextField } from "@mui/material"


export default class Governance extends React.Component {

    constructor() {
        super()
        this.state = {
            proposal: ""

        }
        this.sendProposal = this.sendProposal.bind(this)
        this.deleteProposal = this.deleteProposal.bind(this)
        this.handleChange = this.handleChange.bind(this)
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

    if (this.props.wallet) {

        return (
          <div >

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Governance </Typography>

        
                {this.props.wallet.proposal ? 
                <>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> My Proposal </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> {this.props.wallet.proposal} </Typography>
                    <Button onClick={() => this.deleteProposal()} style={{display: "flex", margin: "auto", backgroundColor: "#FF6584", padding: 10, borderRadius: 15, marginTop: 0}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Change Proposal </Typography>
                    </Button>
                    <br />
                    <br />
                </>
                :
                <>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Submit a proposal for an update to Bergquist Applications </Typography>

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
                        <br />
                        
                    <Button onClick={() => this.sendProposal()} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15, marginTop: "2%"}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Propose </Typography>
                            </Button>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> or vote on an existing measure </Typography>
                </>}
            
            <br />

            <Proposals addresses={this.props.addresses} walletId={this.props.walletId} />
    
          </div>
        )
      }
    
      else {
        return (
          <div>
          </div>
        )
      }
  }
  

      
  }
    
