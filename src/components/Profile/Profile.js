import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import MyAlgo from '@randlabs/myalgo-connect';

import EditProfile from "./EditProfile"
import MyTrees from "./MyTrees"

import { Typography, Button, Grid, Modal, Avatar, IconButton } from "@material-ui/core"
import PersonIcon from '@material-ui/icons/Person'



class Profile extends React.Component {
  constructor() {
    super()
    this.state = {
      profile: null,
      editing: false
    }
    this.setEdit = this.setEdit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.connectToMyAlgo = this.connectToMyAlgo.bind(this)
  }

  
  
  async connectToMyAlgo() {

  try {

    const myAlgoWallet = new MyAlgo()

    console.log(myAlgoWallet)

    const accounts = await myAlgoWallet.connect();

    const addresses = accounts.map(account => account.address);

    firebase.firestore().collection("profiles").where("uid", "==", this.props.user.uid)
    .get()
    .then((query) => {
      query.forEach((doc) => {
        firebase.firestore().collection("profiles").doc(doc.id).update({
          wallet: addresses[0]
        })
      })
      
    })

    console.log(addresses)
    
  } catch (err) {
    console.error(err);
  }
}

  disconnectFromMyAlgo() {
    firebase.firestore().collection("profiles").where("uid", "==", this.props.user.uid)
    .get()
    .then((query) => {
      query.forEach((doc) => {
        firebase.firestore().collection("profiles").doc(doc.id).update({
          wallet: null
        })
      })
      
    })
  }

  

  setEdit() {
    this.setState({
      editing: !this.state.editing
    })
  }

   handleChange(event) {

    const {name, value} = event.target

    this.setState({[name]: value})
  }

  componentDidMount() {

    firebase.firestore().collection("profiles").where("uid", "==", this.props.user.uid)
    .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {

              this.setState({
              profile: doc.data(),
              editing: false
              })
            
            
        })
    });

  }


  render() {

   

      const profilestyle = {
        backgroundColor: "#FFFFF0",
        borderRadius: "15px",
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        paddingLeft: "10px",
        paddingRight: "10px",
        paddingTop: "10px"
      }

    if (this.state.profile) {

      return (
      <div style={profilestyle}>
        <div style={{ textAlign: "center" }}>

          <Grid container>
            <Grid item xs={12} sm={6}>
              {this.state.profile.imageUrl ? 
              <IconButton onClick={() => this.setState({
                editing: !this.state.editing
              })} >
              <Avatar src={this.state.profile.imageUrl} alt="" style={{ height: "60px", width: "60px", display: "inline-block" }} />
              </IconButton> 
              :
              <IconButton onClick={() => this.setState({
                editing: !this.state.editing
              })} >
              <PersonIcon style={{ height: "60px", width: "60px", display: "inline-block" }} />
              </IconButton>
              }
              <Typography variant="h4" style={{ display: "inline-block", paddingTop: "10px" }} color="secondary"> {this.state.profile.username} </Typography>
              <Typography variant="subtitle1" align="center" color="secondary"> {this.state.profile.bio} </Typography>

            </Grid>
            <Grid item xs={12} sm={6}>

              {this.state.profile.wallet ?
              <Button variant="contained" color="primary" onClick={() => this.connectToMyAlgo()}>
              <Avatar variant="square" src="/algorand.svg" alt="Algo" style={{ height: "30px", width: "30px" }} />
              <Typography variant="caption"  style={{marginLeft: 5}}> Connect </Typography>
              </Button>
              
              :
              <Button variant="contained" color="primary" onClick={() => this.connectToMyAlgo()}>
              <Avatar variant="square" src="/algorand.svg" alt="Algo" style={{ height: "30px", width: "30px" }} />
              <Typography variant="caption"  style={{marginLeft: 5}}> Connect </Typography>
              </Button>
              }            
              
            </Grid>
          </Grid>

          

          
        </div>

        {this.state.editing ? 
          <Modal 
          open={true} 
          onClose={() => this.setState({editing: false})}
          style={{
            marginTop: 75,
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <EditProfile bio={this.state.profile.bio} setEdit={this.setEdit} user={this.props.user}/>
          </Modal>
          :
          null }
          
        <br />
        <hr/>
        <MyTrees user={this.props.user} setPage={this.props.setPage} setTree={this.props.setTree} />
      </div>
      )
      
    }

    else {

      return (
        <div>
          <Typography variant="h2" align="left" color="secondary">  </Typography>
        </div>
      )

    }
    
  }
}

export default Profile