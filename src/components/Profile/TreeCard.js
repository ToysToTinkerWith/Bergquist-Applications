import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import { Typography, Avatar, IconButton } from "@material-ui/core"

class PublicTreeCard extends React.Component {
  constructor() {
    super()
    this.state = {
      tree: null,
    }    
  }

  componentDidMount() {
    firebase.firestore().collection("publicTrees").doc(this.props.treeId).onSnapshot(doc => {
        this.setState({
          tree: doc.data(),
      })
    })
  }


  render() {

    const treestyle = {
      width: "150px",
      backgroundColor: "#FFFFF0",
      borderRadius: "15px",
      boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
      textAlign: "center"
      }

        if(this.state.tree) {

            return (
              <div style={treestyle}>

                <Typography variant="overline" align="center" color="secondary"> {this.state.tree.name} </Typography>
                <br/>

                <IconButton 
                  onClick={() => 
                    {this.props.setTree(this.props.treeId)
                    this.props.setPage("Tree")}
                  }
                  >
                  <Avatar src={this.state.tree.imageUrl}  alt="" style={{ width: "100px", height: "100px" }} />
                </IconButton>

                <br />
                <br />                

              </div>
          
        )
        }

        else{

          return (
            <Typography variant="h3" color="secondary"> </Typography>
          )
          
        }
    
  }
}

export default PublicTreeCard