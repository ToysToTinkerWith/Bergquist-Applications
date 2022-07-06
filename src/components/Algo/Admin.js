import React from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

import Proposals from "./Proposals"

import { Button, Typography, Modal, TextField } from "@mui/material"


export default class Admin extends React.Component {

    constructor() {
        super()
        this.state = {
            post: ""

        }
        this.sendPost = this.sendPost.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }


  async sendPost() {

    const postRef = collection(db, "posts")

    await addDoc(postRef, {
        post: this.state.post,
        created: serverTimestamp()
    })

    this.setState({
        post: ""
    })

  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
    [name]: value

    });
  }

  render() {

        return (
          <div >

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Admin </Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Post </Typography>

                    <TextField
                        color="primary"
                        variant="outlined"
                        multiline
                        rows={5}
                        value={this.state.post}
                        type="text"
                        label={<Typography variant="body1" style={{fontFamily: "Chango", color: "#FFFFFF"}}> Post </Typography>}
                        name={"post"}
                        inputProps={{ style: { color: "white", fontFamily: "Chango" }}}

                        sx={{"& .MuiOutlinedInput-root":{"& > fieldset": {border: '2px solid #E6E6E6'}}}}
                        style={{width: "80%", display: "flex", margin: "auto"}}
                        onChange={this.handleChange}
                        />
                        <br />
                        
                    <Button onClick={() => this.sendPost()} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15, marginTop: "2%"}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Send </Typography>
                            </Button>

          
            
            <br />

    
          </div>
        )
    }
    
     
}
  


      
  
    
