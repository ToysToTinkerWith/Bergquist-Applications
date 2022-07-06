
import React, { useEffect } from "react"

import Head from "next/head"

import getStripe from '../../lib/get-stripe';
import Stripe from "stripe";

import { Typography, Card, Grid, Button, TextField } from "@mui/material"

export default class Contact extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            amount: ""
         
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
        console.log(this.state)
        return (
            <div>
                <Head>
                    <title>Contact</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement." />
                    <meta name="keywords" content="Message, Phone, Email, Functional Architecture, Funtional Build, Design Architecture, Design Build" />
                    
                    
                    </Head>

                    <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Contact </Typography>

                    <Grid container >
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                    Message Bergquist Applications by phone or email
                                    
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} >
                                        <Grid container>
                                        <Grid item xs={12} sm={12} md={12} lg={12} style={{padding: 40}}>
                                            <Typography 
                                            variant="h6" 
                                            align="center"
                                            style={{
                                                fontFamily: "Chango",
                                                color: "#E6E6E6"
                                            }}
                                            > 
                                            360-969-9115
                                            </Typography>
                                            <Button href="tel:+13609699115" style={{display: "flex", margin: "auto"}}>
                                                <img src="/Phone.svg" style={{width: 50}} />
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={12} lg={12} style={{padding: 40}}>
                                            <Typography 
                                            variant="h6" 
                                            align="center"
                                            style={{
                                                fontFamily: "Chango",
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
                                <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  
                                    Help Bergquist Applications understand the business model and budget 
                                </Typography>
                                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  
                                    To explore affordable options for success
                                </Typography>
                                <br />
                                <br />
                    
                <div style={{
                    backgroundColor: "#3F3D56",
                  
                }}
                >
                    <Typography variant="h4" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Pay Bergquist Applications </Typography>

                    <Grid container alignItems="center">
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h5" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Pay in United States Dollar </Typography>
                                    <Typography variant="h4" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6"}}> $ </Typography>


                                    <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                    Bergquist Applications uses the Stripe API to accept online payments
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
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h5" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Pay in Algorand </Typography>
                                    <img src="./AlgoWhite.svg" alt="Design" style={{display: "flex", margin: "auto", height: 30}}/>

                                    <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                    Bergquist Applications also accepts payments in Algorand
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}} >
                                    
                                    <img src="./AlgoQR.png" alt="Design" style={{display: "flex", margin: "auto", width: "100%", maxWidth: 284, padding: 10}}/>
                                    <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                   andersbergquist.algo
                                    </Typography>
                                    </Grid>
                                    
                                </Grid>
                                <br />
                    
    
                </div>

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                    Earn rewards on Bergquist Applications 
                </Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                    Help shape the future of web development
                </Typography>
                <br />
                <Grid container >
                    <Grid item xs={12} sm={12} md={6}>
                    <br />
                    <Typography variant="h3" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Discover the power of Algorand </Typography>
                    <img src="./AlgoWhite.svg" alt="Design" style={{display: "flex", margin: "auto", height: 50}}/>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                    by getting the pera wallet app
                    </Typography>
                    
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                    <Button component={Card} onClick={() => window.open("https://perawallet.app/")} style={{display: "block", margin: "auto", border: "1px solid #FCEC54", borderRadius: 15, height: "100%", width: "90%"}}>
                            <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FCEC54"}}>  Pera Wallet   </Typography>
                            <br />
                            <img src="Pera.svg" alt="Pera" style={{height: 50, display: "flex", margin: "auto", borderRadius: 15}} />
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#FCEC54"}}> Hold all digital assets securely on the Algorand Blockchain  </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#FCEC54"}}> Gain rewards through participation in decentralized applications  </Typography>
                            <br />
                        </Button>
                        <br />
                    
                    </Grid>
                        
                </Grid>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> 
                    Participate in Bergquist Applications governance 
                </Typography>
                <Button onClick={() => window.location.href="/future"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Future </Typography>
                    </Button>
                <br />
                <br />
                
            </div>
            
        )
    }
    
}