import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import { db } from "../../../Firebase/FirebaseInit"
import { doc, collection, getDocs, onSnapshot, updateDoc } from "firebase/firestore"

import { DataGrid } from '@mui/x-data-grid';


import { Button, Modal, Card, Typography, Grid } from '@mui/material'


export default class News extends React.Component {

 constructor() {
    super()
    this.state = {
      posts: [],
      post: null
      
    }
  }

componentDidMount() {

    const postsRef = collection(db, "posts")

    this.unsub = onSnapshot(postsRef, (postsSnap) => {

      this.setState({
        posts: []
      })
            
      postsSnap.forEach((post, index) => {

        let postData = post.data()
        postData.id = 12341234
        postData.created = new Date(post.data().created.toDate())

        this.setState(prevState => ({
            posts: [...prevState.posts, postData]
        }))
            

        })

  });



}

componentWillUnmount() {
  this.unsub()
}    

    
render() {

const Columns = [
  
  { 
  field: 'post', 
  headerName: <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Post </Typography>, 
  flex: 2,
  minWidth: 50, 
  renderCell: (params) => (
        
      <Button
      variant="contained"
      color="primary"
      size="small"
      style={{ padding: 10}}
      onClick={() => this.setState({post: params.row.post})}
    >
      <Typography variant="body1" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  {params.row.post.substring(0, 40)}  </Typography>
     
      </Button>
  ),
  },
  
  { 
  field: 'created', 
  headerName: <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Created </Typography>, 
  type: "date",
  flex: 1,
  minWidth: 50, 
  renderCell: (params) => (
        
    <Typography style={{fontFamily: "Chango", color: "#3F3D56"}}> {params.row.created.toDateString()} </Typography>
  ),
  }
  
]

    return (
    <div >
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> News </Typography>

      {this.state.posts.length > 0 ? 
        <DataGrid
            autoHeight
            pageSize={5}
            rows={this.state.posts} 
            columns={Columns} 
        />
      :
      <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  No news to show </Typography>

      }

      {this.state.post ? 
        <Modal 
        open={true} 
        onClose={() => this.setState({post: null})}
        onClick={() => this.setState({post: null})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div style={{backgroundColor: "#3F3D56"}}>
            <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  {this.state.post} </Typography>
          </div>
        
        </Modal>
        :
        null
      }
    </div>
  )
  }


  
  
}
