import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import TreeCard from "./TreeCard"

class MyTrees extends React.Component {
  constructor() {
    super()
    this.state = {
      myTrees: [],
      myTreeIds: []
    }
  }

  componentDidMount() {
    firebase.firestore().collection("publicTrees").where("huggedBy", "array-contains", this.props.user.uid)
    .get()
    .then((querySnapshot) => {
        let myTrees = []
        let myTreeIds = []
        querySnapshot.forEach((doc) => {
            myTrees.push(doc.data())
            myTreeIds.push(doc.id)
        })
        this.setState({
              myTrees: myTrees,
              myTreeIds: myTreeIds
            })

    })
    .catch(function(error) {
        console.log("Error getting documents: ", error)
    })
  }


  render() {
    
       return (
      <div>
        {this.state.myTrees.length > 0 ? this.state.myTrees.map((tree, index) => {
          return (
            <div style={{display: "inline-block", paddingRight: 10, paddingBottom: 10 }} key={tree.psudeoId}>
            <TreeCard user={this.props.user} treeId={this.state.myTreeIds[index]} setPage={this.props.setPage} setTree={this.props.setTree} />          

          </div>
          )
          
        }) :
        null}
      </div>
    )
}
  
}

export default MyTrees