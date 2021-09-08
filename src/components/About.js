import React from "react"

import Contact from "./Contact"

import { Avatar, Grid, Card, Button, Modal, Typography } from "@material-ui/core"

export default class About extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            contact: false
        };
        
      }
      
     

    render() {

        const aboutStyle = {
            backgroundColor: "#FFFFF0",
            
            paddingBottom: "2%",
            marginTop: "4%",
            marginLeft: "2%",
            marginRight: "2%",
        
        }


        return (
            <div>
                <Card style={aboutStyle}>

                    <Grid container style={{marginTop: "4%"}}>
                        <Grid item xs={12} sm={12} md={4}>
                        
                            <Avatar 
                            src="self7.jpg" 
                            style={{
                                width: 200,
                                height: 200,
                                margin: "auto",
                                marginTop: "2%",
                                marginBottom: "2%"
                                
                            }}/>
                            <Typography variant="h6" align="center" color="secondary">  <b>Anders Bergquist</b> </Typography>

                            
                        </Grid>
                        <Grid item xs={12} sm={12} md={8}>
                        <Typography variant="body1" color="secondary" style={{padding: "4%"}}>  I am a full stack developer with a focus in modern web technologies.
                        Since graduating with my degree in Computer Science, I have gained skills in building enterprise level business applications.
                        Featuring components to aid in database managment, user authentication, and secure payment infrastructure. Businesses can customize the way 
                        they want to interact with their data, and choose how they want to be paid by their customers. I encourage people to play around with the example components
                        to visualize a potential business application.   </Typography>
                        <Button variant="contained" color="secondary" style={{display: "flex", margin: "auto"}} onClick={() => this.setState({contact: true})}> Contact </Button>

                        </Grid>

                    </Grid>
                </Card>
                    
                <Grid container style={{marginBottom: "4%"}}>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                        <Card style={{backgroundColor: "#212121", margin: "4%", height: "100%"}}>
                        <img src="React.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 100}}/>
                        <Typography variant="h6" align="center" style={{color: "white"}}>  <b>React</b> </Typography>
                        <Typography variant="body1" style={{color: "white", margin: 20}}> 
                        React is the component-based approach I use to build the user interface of the application. This lets me create web components that can be easily reused from project to project.
                        I couple Next.js with React for more server-side features. With the combination of the two frameworks, I am able to create web applications that are ready for production.
                        </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#212121", margin: "4%", height: "100%"}}>
                        <img src="MaterialUI.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 85}}/>
                        <Typography variant="h6" align="center" style={{color: "white"}}>  <b>Material UI</b> </Typography>
    
                        <Typography variant="body1" style={{color: "white", margin: 20}}> 
                        Material UI is a library of styled React components that I use in my applications. The library is open source and is constantly evolving. I pull components from Material UI
                        not only for a cleaner look in my application, but also to save me time in building complex components from scratch.
                        </Typography>
    
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#212121", margin: "4%", height: "100%"}}>
                        <img src="Firebase.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 60}}/>
                        <Typography variant="h6" align="center" style={{color: "white"}}>  <b>Firebase</b> </Typography>
                        <Typography variant="body1" style={{color: "white", margin: 20}}> 
                        Firebase is the backend infrastructure for the application. The service gives me a database, user authentication, and deployment.
                        Members can be added to each project, allowing business owners access and management over their database without any coding experience.
                        The data is stored on the cloud and is backed by Google servers.
                        </Typography>
    
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#212121", margin: "4%", height: "100%"}}>
                        <img src="Stripe.png" style={{ display: "flex", margin: "auto", marginTop: 20, width: 75}}/>
                        <Typography variant="h6" align="center" style={{color: "white"}}>  <b>Stripe</b> </Typography>
                        <Typography variant="body1" style={{color: "white", margin: 20}}> 
                        Stripe securely handles all payment processing in the application. The platform keeps reports on earnings, allows payouts to other connected accounts,
                        and makes it easy to create custom payment flows within the application.
                        Stripe takes 2.9% plus 30 cents per transaction, but has lower rates for companies making over $80,000 per month.
                        </Typography>
    
                        </Card>
                    </Grid>
                </Grid>
                <br />

                {this.state.contact ? 
                    <Modal 
                    open={true} 
                    onClose={() => this.setState({contact: false})}
                    style={{
                    marginTop: 75,
                    overflowY: "auto",
                    overflowX: "hidden"
                    }}>
                    <Contact />
                    </Modal>
                    :
                    null
                }
            </div>
        )
    }
    
}