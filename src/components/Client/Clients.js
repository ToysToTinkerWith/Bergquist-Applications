import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import { db } from "../../../Firebase/FirebaseInit"
import { collection, getDocs, onSnapshot } from "firebase/firestore"

import NewClient from "./NewClient"
import Client from "./Client"

import { DataGrid } from '@material-ui/data-grid'
import { Button, Modal, Card, Typography } from '@material-ui/core'


import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';


class Clients extends React.Component {

 constructor() {
    super()
    this.state = {
      clients: [],
      newClient: false,
      client: null
    }

  }

componentDidMount = () => {

    const clientRef = collection(db, "clients")

    this.unsub = onSnapshot(clientRef, (clientSnap) => {

      this.setState({
        clients: []
      })
            
      clientSnap.forEach(async (client) => {


          let clientData = client.data()
          clientData.id = client.id

          if (clientData.created) {
            clientData.created = clientData.created.toDate()
          }
          
          const jobsRef = await getDocs(collection(db, "clients", client.id, "jobs"))

          clientData.jobs = []

          jobsRef.forEach((job) => {

            const jobDateFrom = new Date(job.data().scheduledFrom)
            const jobDateTo = new Date(job.data().scheduledTo)

            if (this.props.date > jobDateTo) {
                clientData.jobs.push("#81c784") //green
            }
            else if (this.props.date > jobDateFrom.setHours(0)) {
                clientData.jobs.push("#fff176") //yellow
            }
            else {
                clientData.jobs.push("#64b5f6") //blue
            }

             
          })

    

          this.setState(prevState => ({
              clients: [...prevState.clients, clientData]
          }))

      });


  });



}

componentWillUnmount() {
  this.unsub()
}
    

    

render() {

const Columns = [
  
  { 
  field: 'name', 
  headerName: <Typography style={{color: "#FFFFFF"}}> Client Name</Typography>, 
  flex: 1,
  minWidth: 50, 
  renderCell: (params) => (
        
      <Button
      variant="contained"
      color="secondary"
      size="small"
      style={{ padding: 10 }}
      onClick={() => [this.setState({client: params.row.id})]}
    >
      {params.row.name} 
      </Button>
  ),
  },
  
  { 
  field: 'address', 
  headerName: <Typography style={{color: "#FFFFFF"}}> Address</Typography>, 
  flex: 1,
  minWidth: 50, 
  renderCell: (params) => (
        
    <Typography style={{color: "#FFFFFF"}}> {params.row.address} </Typography>
  ),
  },
  { 
  field: 'email', 
  headerName: <Typography style={{color: "#FFFFFF"}}> Email</Typography>, 
  flex: 1,
  minWidth: 50, 
  renderCell: (params) => (
        
    <Typography style={{color: "#FFFFFF"}}> {params.row.email} </Typography>
  ),
  },
  { 
    field: 'phone', 
    type: "number",
    headerName: <Typography style={{color: "#FFFFFF"}}> Phone </Typography>, 
    flex: 1,
    minWidth: 50, 
    renderCell: (params) => (
        
      <Typography style={{color: "#FFFFFF"}}> {params.row.phone} </Typography>
    ),
    },
  { 
    field: 'jobs', 
    headerName: <Typography style={{color: "#FFFFFF"}}> Jobs</Typography>,
    flex: 1,
    minWidth: 50, 
    renderCell: (params) => (

        params.row.jobs.length > 0 ? params.row.jobs.map((job) => {
            return (
                <FiberManualRecordIcon style={{color: job}}/>
            )
        })
        :
        null
        
            
    ),
    }



]


  const uploadstyle = {
    backgroundColor: "#3F3D56",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    padding: 10,
    marginBottom: 40

  }


    return (
    <Card style={uploadstyle}>
      <br />
        <Typography variant="h4" align="left" style={{color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Data Grids </Typography>
        <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
        Organize and display collections of large data. Sort the data by any field value, and customize the way each field is viewed.
        List out data from the database and provide means to interact.
        
        </Typography>
        <Button 
        variant="contained"
        color="secondary"
        style={{margin: 10}}
        
        onClick={() => this.setState({newClient: true})}
        > 
        +Client 
        </Button>


        <DataGrid
        autoHeight
        pageSize={5}
        rows={this.state.clients} 
        columns={Columns} 
        />


        {this.state.newClient ?
        <Modal 
        open={true} 
        onClose={() => this.setState({newClient: false})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div>
            <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({newClient: false})}> Back </Button>
            <NewClient goBack={() => this.setState({newClient: false})}/>
          </div>
          
        </Modal>
        
        :
        null
        }

        {this.state.client ?
        <Modal 
        open={true} 
        onClose={() => this.setState({client: null})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div>
            <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({client: null})}> Back </Button>
            <Client products={this.props.products} checkout={this.props.checkout} date={this.props.date} clientId={this.state.client}/>
          </div>
          
        </Modal>
        
        :
        null
        }
        
    </Card>
  )
  }


  
  
}

export default Clients