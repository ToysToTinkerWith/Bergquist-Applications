import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import NewClient from "./NewClient"

import { DataGrid } from '@material-ui/data-grid'
import { Button, Modal } from '@material-ui/core'

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';



class Clients extends React.Component {

 constructor() {
    super()
    this.state = {
      clients: [],
      newClient: false
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
                client.jobs.push("#e57373") //red
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

const Columns = [
  
  { 
  field: 'name', 
  headerName: 'Client Name', 
  width: 180,
  renderCell: (params) => (
        
      <Button
      variant="contained"
      color="Secondary"
      size="small"
      style={{ padding: 10 }}
      onClick={() => [this.props.setClient(params.row.id), this.props.setPage("Client")]}
    >
      {params.row.name} 
      </Button>
  ),
  },
  
  { 
  field: 'address', 
  headerName: 'Address', 
  width: 150,  
  },
  { 
    field: 'jobs', 
    headerName: 'Jobs', 
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
    width: "100%"

  }


    return (
    <div style={uploadstyle}>
        
        <Button 
        variant="contained"
        color="secondary"
        style={{margin: 10}}
        
        onClick={() => this.setState({newClient: true})}
        > 
        +Client 
        </Button>

        <DataGrid rows={this.state.clients} columns={Columns} autoHeight={true}/>

        {this.state.newClient ?
        <Modal 
        open={true} 
        onClose={() => this.setState({newClient: false})}
        style={{
          marginTop: 75,
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <NewClient goBack={() => this.setState({newClient: false})}/>
        </Modal>
        
        :
        null
        }
        
    </div>
  )
  }


  
  
}

export default Clients