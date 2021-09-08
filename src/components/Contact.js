import React from "react";

import firebase from "firebase/app"
import "firebase/firestore"

import { Grid, Typography, TextField, Button } from "@material-ui/core"

export default class Contact extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "",
            email: "",
            phone: "",
            message: "",
            error: "",
            success: ""
        };
        this.handleChange = this.handleChange.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
      }

      sendMessage() {

        if (this.state.message && this.state.name && (this.state.email || this.state.phone)) {
            firebase.firestore().collection("messages").add({
                name: this.state.name,
                email: this.state.email,
                phone: this.state.phone,
                message: this.state.message
            }).then(doc => {
                this.setState({
                    name: "",
                    email: "",
                    phone: "",
                    message: "",
                    error: "",
                    success: "Message recieved. I will get back to you as soon as possible."
    
                })
            })
        }

        else {
            this.setState({
                error: "Enter your name, your phone and/or email, and a message.",
                success: ""
            })
        }
        
      }

      handleChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
        [name]: value,
        success: "",
        error: ""
        });
      }


    render() {

        const clientStyle = {
            backgroundColor: "#FFFFF0",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            padding: "10px",
            margin: "10px",
        
        }

        return (
            <div style={clientStyle}>
                <Typography variant="body1" align="center" color="secondary" style={{margin: "2%"}}>
                    Pricing varies depending on the extensiveness of the application. Send me a message and we can talk options.
                </Typography>
                <Grid container alignItems="center" >
                    <Grid item xs={12} sm={12} md={6} >
                        <div >
                        <TextField
                            onChange={this.handleChange}
                            value={this.state.name}
                            color="secondary"
                            type="text"
                            label="Name"
                            name="name"
                            style={{
                                display: "flex",
                                margin: "auto",
                                width: 300
                            }}
                            
                        />
                        <br />

                        <TextField
                            onChange={this.handleChange}
                            value={this.state.email}
                            color="secondary"
                            type="text"
                            label="Email"
                            name="email"
                            style={{
                                display: "flex",
                                margin: "auto",
                                width: 300
                            }}
                        />
                        <br />

                        <TextField
                            onChange={this.handleChange}
                            value={this.state.phone}
                            color="secondary"
                            type="text"
                            label="Phone"
                            name="phone"
                            style={{
                                display: "flex",
                                margin: "auto",
                                width: 300
                            }}
                        />
                        <br />

                        </div>
                        
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        

                        <TextField
                            color="secondary"
                            onChange={this.handleChange}
                            value={this.state.message}
                            multiline
                            rows={3}
                            value={this.state.message}
                            variant="outlined"
                            type="text"
                            label="Message"
                            name="message"
                            style={{
                            display: "flex",
                            margin: "auto",
                            width: "70%"
                            }}
                        />
                    </Grid>
                </Grid>

                <Typography style={{color: "#d32f2f"}} align="center" variant="body1">
                {this.state.error} 
                </Typography>
                <Typography style={{color: "#388e3c"}} align="center" variant="body1">
                {this.state.success} 
                </Typography> 
                <br />
                <Button variant="contained" color="secondary" onClick={() => this.sendMessage()} style={{display: "flex", margin: "auto"}}> Send</Button>
            </div>
        )
    }
}