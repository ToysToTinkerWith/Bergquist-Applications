import React from 'react'

import firebase from "firebase/app"
import "firebase/firestore"

import { DataGrid } from '@material-ui/data-grid'
import { Button } from '@material-ui/core/'



class Database extends React.Component {

 constructor() {
    super()
    this.state = {
      trees: [],
      posts: []
    }

  }

componentDidMount = () => {

    firebase.firestore().collection("publicTrees").onSnapshot(querySnapshot => {

      this.setState({ trees: [], posts: [] })

      querySnapshot.forEach(doc => {

        /*
        firebase.firestore().collection("publicTrees").doc(doc.id).update({
          flag: ""
        })
        */

        let tree = doc.data()
        tree.id = doc.id

        if (tree.timestamp) {
          tree.created = tree.timestamp.toDate()

        }

        
        this.setState(prevState => ({
            trees: [...prevState.trees, tree]
          }))

        firebase.firestore().collection("publicTrees").doc(doc.id).collection("posts")
        .get().then(querySnapshot => {

          let self = this

          querySnapshot.forEach(function(doc) {
            let post = doc.data()
            post.id = doc.id
            post.tree = tree

            self.setState(prevState => ({
              posts: [...prevState.posts, post]
            }))

          })


        })

      })
      

    })


}
    

    

render() {

const treeColumns = [
  { 
    field: 'flag', 
    headerName: 'Flag', 
    width: 180,
    
  },
  { 
  field: 'name', 
  headerName: 'Tree Name', 
  width: 180,
  renderCell: (params) => (
        
      <Button
      variant="contained"
      color="Secondary"
      size="small"
      style={{ padding: 10 }}
      onClick={() => [this.props.setTree(params.row.id), this.props.setPage("Tree")]}
    >
      {params.row.name} 
      </Button>
  ),
  },
  
  { 
  field: 'created', 
  headerName: 'Created', 
  width: 150,
  type: "date"
  
  }


]


  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    width: "100%"

  }


  if (this.state.trees.length > 0) {
    return (
    <div style={uploadstyle}>
        <DataGrid rows={this.state.trees} columns={treeColumns} autoHeight={true}/>
        
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

export default Database