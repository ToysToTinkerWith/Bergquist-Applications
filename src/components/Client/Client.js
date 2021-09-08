import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import Job from "../Job/Job"
import EditClient from "./EditClient"
import NewJobClientView from "../Job/NewJobClientView"

import { Button, Typography, Modal } from "@material-ui/core"


export default class Client extends React.Component {

    constructor() {
        super()
        this.state = {
            client: null,
            page: null,
            jobIds: []

        }
    }


  componentDidMount() {
    firebase.firestore().collection("clients").doc(this.props.clientId).onSnapshot(doc => {
        let client = doc.data()

        this.setState({
          client: client
        })

      })

        firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs")
        .orderBy("created", "desc").onSnapshot((querySnapshot) => {

        this.setState({
          jobIds: []
        })

        var jobIds = []

        querySnapshot.forEach(function(doc) {
            jobIds.push(doc.id)
        })

        this.setState({
            jobIds: jobIds
        })

        })
      
  }

  
    

  render() {

    console.log(this.props.date)


    if (this.state.client) {

        const clientStyle = {
            backgroundColor: "#FFFFF0",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            padding: "10px",
        }

        return (
          <div style={clientStyle}>
            <Button style={{float: "right"}} variant="contained" color="secondary" onClick={() => 
            this.setState({page: "edit"})}>
              Edit
            </Button>
            <Typography variant="h4" color="secondary"> {this.state.client.name} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.address} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.email} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.phone} </Typography>
            <br />
            
            <Button variant="contained" color="secondary" align="center" style={{display: "flex", margin: "auto"}} onClick={() => this.setState({page: "newJob"})}> + Job </Button>
            <br />
            {this.state.page === "edit" ? 
            <Modal 
            open={true} 
            onClose={() => this.setState({page: null})}
            style={{
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              <div>
                <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({page: null})}> Back </Button>
                <EditClient clientId={this.props.clientId} client={this.state.client} goBack={() => this.setState({page: null})} />
              </div>
            
            </Modal>
            :
            null
            }

            {this.state.page === "newJob" ? 
            <Modal 
            open={true} 
            onClose={() => this.setState({page: null})}
            style={{
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              <div>
                <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({page: null})}> Back </Button>
                <NewJobClientView date={this.props.date} products={this.props.products} client={this.state.client} clientId={this.props.clientId} closeModal={() => this.setState({page: null})} />
              </div>
            
            </Modal>
            :
            null
            }
    
            {this.state.jobIds.length > 0 ? this.state.jobIds.map((jobId, index) => {
              return <Job key={index} checkout={this.props.checkout} date={this.props.date} clientId={this.props.clientId} jobId={jobId} />
              
              
            })
            :
            null}
    
            <br />
    
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
    
