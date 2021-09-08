import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import NewClient from "./NewClient"
import Client from "./Client"

import { DataGrid } from '@material-ui/data-grid'
import { Button, Modal, Card } from '@material-ui/core'

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

    firebase.firestore().collection("clients").onSnapshot(querySnapshot => {

      this.setState({ clients: [], posts: [] })

      querySnapshot.forEach(doc => {

        let client = doc.data()
        client.id = doc.id

        if (client.created) {
          client.created = client.created.toDate()
        }

        firebase.firestore().collection("clients").doc(doc.id).collection("jobs")
        .get().then(querySnapshot => {

          let self = this

          client.jobs = []

          querySnapshot.forEach(function(doc) {
            let job = doc.data()
            const jobDateFrom = new Date(job.scheduledFrom)
            const jobDateTo = new Date(job.scheduledTo)

            if (self.props.date > jobDateTo) {
                client.jobs.push("#81c784") //green
            }
            else if (self.props.date > jobDateFrom.setHours(0)) {
                client.jobs.push("#fff176") //yellow
            }
            else {
                client.jobs.push("#64b5f6") //blue
            }

          })

          this.setState(prevState => ({
            clients: [...prevState.clients, client]
          }))


        })

      })
      

    })


}
    

    

render() {
  console.log(this.props.date)

const Columns = [
  
  { 
  field: 'name', 
  headerName: 'Client Name', 
  width: 200,
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
  headerName: 'Address', 
  width: 200,  
  },
  { 
  field: 'email', 
  headerName: 'Email', 
  width: 200,  
  },
  { 
    field: 'phone', 
    headerName: 'Phone', 
    width: 200,  
    },
  { 
    field: 'jobs', 
    headerName: 'Jobs',
    width: 200,
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
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    width: "100%",
    height: "60vh"

  }


    return (
    <Card style={uploadstyle}>
        
        <Button 
        variant="contained"
        color="secondary"
        style={{margin: 10}}
        
        onClick={() => this.setState({newClient: true})}
        > 
        +Client 
        </Button>

        <DataGrid rows={this.state.clients} columns={Columns} />

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