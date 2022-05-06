
import React, { useEffect } from "react"

import Head from "next/head"

import getStripe from '../../lib/get-stripe';
import Stripe from "stripe";

import { Typography, Card, Grid, Button, TextField } from "@mui/material"

export default class Contact extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            amount: null
        }
        this.redirectToCheckout = this.redirectToCheckout.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    redirectToCheckout = async () => {
        // Create Stripe checkout
        const response = await fetch('/api/checkout-sessions', {
          method: "POST",
          body: JSON.stringify({
            success_url: window.location.href,
            cancel_url: window.location.href,
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Bergquist Applications Services",
                    },
                    unit_amount: this.state.amount * 100,
                },
                quantity: 1,
                
          }],
            payment_method_types: ["card"],
            mode: "payment",
          }),
          headers: {
            "Content-Type": "application/json",
          }
            
        });
      
        const session = await response.json()
        console.log(session)
      
      
      
        // Redirect to checkout
        const stripe = await getStripe();
        await stripe.redirectToCheckout({ sessionId: session.id });
      };

    handleChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (value < 0) {
        value = 0
    }

    this.setState({
    [name]: value
    });
    }

    render() {
        return (
            <div style={{padding: 20}}>
                <Head>
                    <title>Contact</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement." />
                    <meta name="keywords" content="Message, Phone, Email, Functional Architecture, Funtional Build, Design Architecture, Design Build" />
                    
                    <meta property="og:url" content="https://andersbergquist.com/contact" key="ogcontacturl" />
                    <meta property="og:title" content="Contact" key="ogcontact" />
                    <meta property="og:description" content="Help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement." key="ogcontactdesc" />
                    </Head>
                
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 20
                }}
                >
                    <Grid container >
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Contact </Typography>
                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Message Bergquist Applications by phone or email. We will set up a time to talk about
                                    possible solutions to existing deficits, payment infrastructure, and important data to collect for the business moving forward.
                                    
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} >
                                        <Grid container>
                                        <Grid item xs={12} sm={12} md={12} lg={12} style={{padding: "5%"}}>
                                            <Typography 
                                            variant="h6" 
                                            align="center"
                                            style={{
                                                fontFamily: "MoonBold",
                                                color: "#E6E6E6"
                                            }}
                                            > 
                                            360-969-9115
                                            </Typography>
                                            <Button href="tel:+13609699115" style={{display: "flex", margin: "auto"}}>
                                                <img src="/Phone.svg" style={{width: 50}} />
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={12} lg={12} style={{padding: "5%"}}>
                                            <Typography 
                                            variant="h6" 
                                            align="center"
                                            style={{
                                                fontFamily: "MoonBold",
                                                color: "#E6E6E6"
                                            }}
                                            > 
                                            abergquist96@gmail.com
                                            </Typography>
                                            <Button href="mailto:abergquist96@gmail.com" style={{display: "flex", margin: "auto", height: 50}}>
                                                <img src="/Email.svg" style={{width: 50}}/>
                                            </Button>
                                            
                                        </Grid>
                                        </Grid>
    
                                    </Grid>
                                    
                                </Grid>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    
                                    This step is to help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement. Before 
                                    building the application, we come to a consensus on what the build will be. Our architecture packages are cheap options for businesses to work closely
                                    Bergquist Applications, to figure out the potential of progressive web development.
                                    </Typography>
                    
    
                </Card>

                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                }}
                >
                    <Grid container alignItems="center">
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Pay Bergquist Applications </Typography>
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20, paddingLeft: 40, paddingRight: 40}}> Pay in United States Dollar </Typography>
                                    <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> $ </Typography>


                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Bergquist Applications uses the Stripe API to accept online payments. Stripe is constantly adding new features to the API, allowing me to add new features to all Bergquist Applications. 
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} >
                                    <TextField
                                        onChange={this.handleChange}
                                        value={this.state.amount}
                                        type="number"
                                        label="Amount $"
                                        name="amount"
                                        autoComplete="false"
                                        color="primary"
                                        sx={{"& .MuiOutlinedInput-root":{"& > fieldset": {border: '2px solid #6C63FF'}}}}
                                        style={{
                                        display: "flex",
                                        margin: "auto",
                                        width: "70%"
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        style={{display: "flex", margin: "auto", marginTop: 40}}
                                        onClick={() => this.redirectToCheckout()}>
                                        Pay
                                    </Button>

                                    </Grid>
                                    
                                </Grid>
                               

                                <Grid container >
                                <Grid item xs={12} sm={12} md={6}alignItems="center">
                                    <br />
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20, paddingLeft: 40, paddingRight: 40 }}> Pay in Algorand </Typography>
                                    <img src="./AlgoWhite.svg" alt="Design" style={{display: "flex", height: 40, padding: 10, marginLeft: 30}}/>

                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Bergquist Applications also accepts payments in Algorand. Algorand is a carbon negative cryptocurrency that is bringing new and exciting features to finance. This form of payment allows users to pay for goods and services peer to peer.                                    
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}} >
                                        
                                    <img src="./AlgoQR.png" alt="Design" style={{display: "flex", margin: "auto", width: "100%", maxWidth: 284, padding: 10}}/>
                                    
                                    </Grid>
                                    
                                </Grid>
                                <br />
                    
    
                </Card>
                
            </div>
            
        )
    }
    
}