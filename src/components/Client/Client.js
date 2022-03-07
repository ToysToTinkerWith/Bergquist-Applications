import React from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { doc, collection, onSnapshot, orderBy, query } from "firebase/firestore"

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

    const clientRef = doc(db, "clients", this.props.clientId)

    this.unsubClient = onSnapshot(clientRef, (client) => {
        this.setState({
          client: client.data()
        })
    })

    const jobRef = collection(db, "clients", this.props.clientId, "jobs")

    const jobQuery = query(jobRef, orderBy("created", "desc"))

    this.unsubJobs = onSnapshot(jobQuery, (jobSnapshot) => {

      this.setState({
        jobIds: []
      })

      jobSnapshot.forEach((job) => {
        this.setState(prevState => ({
          jobIds: [...prevState.jobIds, job.id]
        }))
      })
    })

    
      
  }

  
    

  render() {

    if (this.state.client) {

        const clientStyle = {
            backgroundColor: "#3F3D56",
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
    
