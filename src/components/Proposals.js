import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import { db } from "../../Firebase/FirebaseInit"
import { doc, collection, getDocs, onSnapshot, updateDoc } from "firebase/firestore"

import { DataGrid } from '@mui/x-data-grid';


import { Button, Modal, Card, Typography, Grid } from '@mui/material'


export default class Proposals extends React.Component {

 constructor() {
    super()
    this.state = {
      proposals: [],
      proposal: null
      
    }

    this.voteProposal = this.voteProposal.bind(this)

  }

componentDidMount() {

    const walletsRef = collection(db, "wallets")

    this.unsub = onSnapshot(walletsRef, (walletsSnap) => {

      this.setState({
        proposals: []
      })
            
      walletsSnap.forEach((wallet) => {

        if (this.props.addresses.includes(wallet.id)) {
          if (wallet.data().proposal) {

            console.log(wallet.data().proposal)
  
            let newProposal = true
            let oldProposalIndex = 0
  
            this.state.proposals.forEach((proposal, index) => {
              if (wallet.data().proposal == proposal[0]) {
                newProposal = false
                oldProposalIndex = index
              }
            })
  
            if (newProposal) {
              this.setState(prevState => ({
                proposals: [...prevState.proposals, {id: wallet.id, proposal: wallet.data().proposal, votes: 1}]
              }))
            }
  
            else {
  
              let oldState = [...this.proposals]
              oldState[oldProposalIndex].voted = oldState[oldProposalIndex].voted + 1
              this.setState({
                proposals: oldState
              })
            }
          }
        }

        

      });


  });



}

componentWillUnmount() {
  this.unsub()
}

async voteProposal(proposal) {
  const walletRef = doc(db, "wallets", this.props.walletId)

  await updateDoc(walletRef, {
      proposal: proposal
  })
}
    

    

render() {

console.log(this.state)

const Columns = [
  
  { 
  field: 'proposal', 
  headerName: <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Proposal </Typography>, 
  flex: 2,
  minWidth: 50, 
  renderCell: (params) => (
        
      <Button
      variant="contained"
      color="primary"
      size="small"
      style={{ padding: 10, backgroundColor: "#3F3D56"}}
      onClick={() => this.setState({proposal: params.row.proposal})}
    >
      <Typography variant="body1" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  {params.row.proposal.substring(0, 20)}  </Typography>
     
      </Button>
  ),
  },
  
  { 
  field: 'votes', 
  headerName: <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Votes </Typography>, 
  type: "number",
  flex: 1,
  minWidth: 50, 
  renderCell: (params) => (
        
    <Typography style={{fontFamily: "Chango", color: "#3F3D56"}}> {params.row.votes} </Typography>
  ),
  },
  { 
    field: "id",
    headerName: <Typography variant="h6" algin="center" style={{fontFamily: "Chango", color: "#3F3D56"}}>  </Typography>, 
    flex: 1,
    minWidth: 50, 
    renderCell: (params) => (
      <Button
      variant="contained"
      color="primary"
      size="small"
      style={{ padding: 10, backgroundColor: "#3F3D56", display: "flex", margin: "auto"}}
      onClick={() => this.voteProposal(params.row.proposal)}
      >
      <Typography variant="body1" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  Vote </Typography>
     
      </Button>    
    ),
    }
]

    return (
    <div style={{margin: "2%"}}>
      {this.state.proposals.length > 0 ? 
        <DataGrid
            autoHeight
            pageSize={5}
            rows={this.state.proposals} 
            columns={Columns} 
        />
      :
      <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  No proposals to vote on </Typography>

      }

      {this.state.proposal ? 
        <Modal 
        open={true} 
        onClose={() => this.setState({proposal: null})}
        onClick={() => this.setState({proposal: null})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div style={{backgroundColor: "#3F3D56"}}>
            <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  {this.state.proposal} </Typography>
          </div>
        
        </Modal>
        :
        null
      }
    </div>
  )
  }


  
  
}
