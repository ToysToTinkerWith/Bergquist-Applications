
import React from "react"


import Head from "next/head"

import Frameworks from "../components/Animations/Frameworks"

import Responsive from "../components/Animations/Responsive"
import HomeAni from "../components/Animations/HomeAni"


import { Typography, Card, Grid, TextField, Button, Avatar } from "@mui/material"

export default class How extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            width: 0,
            height: 0
        }
        this.handleChange = this.handleChange.bind(this)
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
    }
    
    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
      }


    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);


    }
    
    
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
        
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
            <div>
                <Head>
                    <title>How it Works</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Bergquist Applications is a product of independant web development research. Years of practice in building applications with modern web technologies, that serve use cases on every level. Progressive means that the business will evolve to fit best practices in modern web development." />
                    <meta name="keywords" content="Modern Web Development, Responsive Design, Dynamic Data" />
                    
                    
                </Head>

                <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  How it Works </Typography>


                <Grid container>
                    <Grid item xs={12} sm={8} md={8}>
                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: "5%", paddingBottom: 0}}>  In Short </Typography>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Modern Development Technology </Typography>

                    </Grid>
                    <Grid item xs={12} sm={4} md={4} >
                    <Frameworks />

                    </Grid>
                </Grid>

                
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%", paddingTop: 0}}> Bergquist Applications uses a <b style={{color: "#24CCFF"}}>React</b> Framework called <b style={{color: "#3F3D56"}}>Next.js</b> </Typography>
                
                <Grid container >
                    <Grid item xs={12} sm={12} md={6} style={{padding: "2%"}} >
                        <Button component={Card} onClick={() => window.open("https://reactjs.org/")} style={{display: "block", margin: "auto", border: "1px solid #24CCFF", borderRadius: 15, height: "100%", width: "100%"}}>
                            <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#24CCFF"}}>  React   </Typography>
                            <br />
        
                        </Button>

                    </Grid>
                    <Grid item xs={12} sm={12} md={6} style={{padding: "2%"}} >
                        <Button component={Card} onClick={() => window.open("https://nextjs.org/")} style={{display: "block", margin: "auto", border: "1px solid #3F3D56", borderRadius: 15, height: "100%", width: "100%"}}>
                        <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56"}}>  Next.js   </Typography>
                            <br />
                         
                          
                        </Button>

                    </Grid>
                    
                </Grid>

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%", paddingTop: 0}}> which allows for simple integration of everything the app needs  </Typography>

                <div style={{backgroundColor: "#3F3D56", padding: "5%"}}>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}>  core packages </Typography>

                <Grid container >
                    <Grid item xs={12} sm={12} md={4} style={{padding: "2%"}} >
                        <Button component={Card} onClick={() => window.open("https://firebase.google.com/")} style={{display: "block", margin: "auto", border: "1px solid #FFA000", borderRadius: 15, height: "100%", width: "100%"}}>
                            <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FFA000"}}>  Firebase   </Typography>
                            <br />
                            <img src="Firebase.svg" alt="Firebase" style={{height: 50, display: "flex", margin: "auto"}} />
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#FFA000"}}> houses all the custom data for the application  </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#FFA000"}}> built and backed by google  </Typography>
                            <br />
                        </Button>

                    </Grid>
                    <Grid item xs={12} sm={12} md={4} style={{padding: "2%"}} >
                        <Button component={Card} onClick={() => window.open("https://stripe.com/")} style={{display: "block", margin: "auto", border: "1px solid #6474E4", borderRadius: 15, height: "100%", width: "100%"}}>
                        <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6474E4"}}>  Stripe   </Typography>
                            <br />
                            <img src="Stripe.png" alt="Stripe" style={{height: 50, display: "flex", margin: "auto"}} />
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#6474E4"}}> accept payments through the application   </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#6474E4"}}> track sales of products and services  </Typography>
                            <br />
                        </Button>

                    </Grid>
                    <Grid item xs={12} sm={12} md={4} style={{padding: "2%"}} >
                        <Button component={Card} onClick={() => window.open("https://mui.com/")} style={{display: "block", margin: "auto", border: "1px solid #00B0FF", borderRadius: 15, height: "100%", width: "100%"}}>
                        <br />
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#00B0FF"}}>  MUI   </Typography>
                            <br />
                            <img src="MaterialUI.svg" alt="Firebase" style={{height: 50, display: "flex", margin: "auto"}} />
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#00B0FF"}}> sophisticated look for the application </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#00B0FF"}}> responsive design and data visualization </Typography>
                            <br />
                        </Button>

                    </Grid>
                </Grid>

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}>  and more depending on the application </Typography>




                </div>

                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> A user interface that matches the brand and business  </Typography>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%", paddingTop: 0, paddingBottom: 0}}> with resposive data visualization   </Typography>
                <Responsive />
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%", paddingTop: 0}}> and full control over all business and payment data  </Typography>

                <div style={{backgroundColor: "#3F3D56", padding: "5%"}}>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}> With the help of modern development tools  </Typography>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "2%"}}> build scalable applications for business marketing and management </Typography>
                <br />

                    <Button onClick={() => window.location.href="/services"} style={{display: "flex", margin: "auto", backgroundColor: "#FF6584", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Services </Typography>
                    </Button>
                </div>

                
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: "5%"}}>  Get Started  </Typography>

                    <Grid alignItems="center" container style={{padding: "5%"}}>
                        <Grid item xs={12} sm={12} md={6}>
                        <HomeAni />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Contact Bergquist Applications today to explore options for business or personal success  </Typography>

                        <Button onClick={() => window.location.href="/contact"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Contact </Typography>
                        </Button>


                        </Grid>
                    </Grid>
                
                
                
            </div>
            
        )
      }

    
}