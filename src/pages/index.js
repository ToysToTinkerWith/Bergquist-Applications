import React from "react"

import Head from "next/head"

import Contact from "./contact"
import Animation from "../components/Animation"


import { Grid, Card, Modal, Typography } from "@mui/material"

export default class Index extends React.Component { 
     

    render() {

        const aboutStyle = {
            
            padding: "2%",
        
        }


        return (
            <div>
                <Head>
                <title>Bergquist Applications</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Web applications have expanded throughout the development of the internet. Users expect their experience to be fast, reliable, and easy. Bergquist Applications is a suite of libraries, built on the cloud, to deliver on these expectations." />
                <meta name="keywords" content="Progressive Web Development, Modern Development Tools, Database, Styled Components, Authentication, Payment Processing" />

                
                </Head>
                <div style={aboutStyle}>

     
                        
                            <Animation />
                            <br />


                            <Card style={{backgroundColor: "#3F3D56", margin: "2%", padding: "2%", marginBottom: 0, height: "100%", borderRadius: 15}}>
                            <br />
                            <Typography variant="h4" align="left" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}>  <b>Progressive Web Development</b> </Typography>
                            <Typography variant="body1" style={{color: "#E6E6E6", padding: 20, fontFamily: "MoonBold"}}> 
                            Web applications have expanded throughout the development of the internet. Users expect their experience to be fast, reliable, and easy. 
                            Bergquist Applications is a suite of libraries, built on the cloud, to deliver on these expectations. 
                            An important part of the architecture and design of our applications, are the interfaces they offer the developer, as they provide them with the flexibility to deliver a wide range of functionality.
                            </Typography>
                            <Typography variant="body1" style={{color: "#E6E6E6", padding: 20, fontFamily: "MoonBold"}}> 
                            As the internet has progressed, so too, have the tools to build more creative, more powerful applications. When better tools become available, Bergquist Applications researches and develops them for use, in future and current Bergquist applications. 
                            Some components to look forward to are decentralized blockchain options, and artificial inteligence agents.
                            </Typography>
                            
                            
                            </Card>
                            <br />
                            <br />
                            
                        <Card style={{backgroundColor: "#3F3D56", margin: "2%", padding: "2%", marginBottom: 0, height: "100%", borderRadius: 15}}>
                            <br />
                            
                            
                            <Grid container >
                            <Grid item xs={12} sm={12} md={6}>
                                    <Typography variant="h5" align="left" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}>  <b>User Engagement</b> </Typography>
                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Keep them interested. Incentivize interactivity between the customer and the business. Store client data on service performance, and collect feedback, to consistently improve on the product, and offer an experience worth
                                    coming back for.
                                    </Typography>
                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Bergquist Applications works off of popular marketing strategies, aiming for simple, yet effective communication. Aesthetic and functional components can be customized until they best serve the business model, and updates can be made live within minutes.
                                    Think of a something with the depth of Facebook or Amazon.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('UserEngage.svg')", backgroundSize: "cover"}}>
                                <br />
                                <img src="World.svg" style={{ width: "100%", maxHeight: 200}}/>

                                </Grid>
                                
                            </Grid>

                            <br />
                            <br />

                            <Grid container wrap="reverse">
                       
                                <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}}>
                                <br />
                                <img src="Moon.svg" style={{ width: "100%", maxHeight: 200}}/>

                                </Grid>
                                <Grid item xs={12} sm={12} md={6} >
                                    <Typography variant="h5" align="left" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}>  <b>Business Automation</b> </Typography>
                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Less phone calls. Streamline client processes that lead to sale. Automate scheduling, and introduce client to employee interaction only when necessary. Keep everyone that interacts with the business
                                    informed on the day to day.
                                    </Typography>
                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Know that different customers like to interact with the business in different ways. Provide different paths for customers to make appointments or purchase products. 
                                    Steer the audience member in a way that will best service their particular needs.
                                    </Typography>
                                </Grid>
                            </Grid>
                            <br />
                            <br />

                            <Grid container>
                            <Grid item xs={12} sm={12} md={6}>
                                <Typography variant="h5" align="left" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}>  <b>Data Collection</b> </Typography>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                Data is power. Businesses with the most data, and the best data, will be able to improve on their services the most, and offer the best products.
                                We build applications that give complete control over the database. The data is your data, and we're here to help you display and interact with that data in unimaginable ways.
                                </Typography>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                Collect the right data for business success. Including but not limited to: geographic, time, media (images, audio, video), product, purchasing, and client information.
                                </Typography>

                                </Grid>
                                <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('DataCollect.svg')", backgroundSize: "cover"}}>
                                <br />
                                    <img src="Saturn.svg" style={{ width: "100%", maxHeight: 300}}/> 
                                </Grid>
                                
                            </Grid>
                            <br />
                            <br />
                        </Card>
                        
                      
                </div>

                
                    
                <Grid container style={{marginBottom: "4%"}}>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                        <Card style={{backgroundColor: "#3F3D56", margin: "4%", height: "100%", borderRadius: 15}}>
                        <img src="React.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 100}}/>
                        <Typography variant="h6" align="center" style={{fontFamily: "MoonBold", color: "#E6E6E6"}}>  <b>React</b> </Typography>
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", margin: 20}}> 
                        React is the component-based approach used to build the user interface of the application. This lets us create web components that can be easily reused from project to project.
                        We couple Next.js with React for more server-side features. With the combination of the two frameworks, we are able to create web applications that are ready for production.
                        </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#3F3D56", margin: "4%", height: "100%", borderRadius: 15}}>
                        <img src="MaterialUI.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 85}}/>
                        <Typography variant="h6" align="center" style={{fontFamily: "MoonBold", color: "#E6E6E6"}}>  <b>Material UI</b> </Typography>
    
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", margin: 20}}> 
                        Material UI is a library of styled React components that we use in our applications. The library is open source and is constantly evolving. We pull components from Material UI
                        not only for a cleaner look in our applications, but also to save us time in building complex UI components from scratch.
                        </Typography>
    
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#3F3D56", margin: "4%", height: "100%", borderRadius: 15}}>
                        <img src="Firebase.svg" style={{ display: "flex", margin: "auto", marginTop: 20, width: 60}}/>
                        <Typography variant="h6" align="center" style={{fontFamily: "MoonBold", color: "#E6E6E6"}}>  <b>Firebase</b> </Typography>
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", margin: 20}}> 
                        Firebase is the backend infrastructure for the application. The service gives us database control, user authentication, deployment, and analytics.
                        Members can be to each project, allowing business owners access and management over their own database without any coding experience.
                        The data is stored on the cloud and is backed by Google servers.
                        </Typography>
    
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} style={{paddingTop: 20}}>
                    <Card style={{backgroundColor: "#3F3D56", margin: "4%", height: "100%", borderRadius: 15}}>
                        <img src="Stripe.png" style={{ display: "flex", margin: "auto", marginTop: 20, width: 75}}/>
                        <Typography variant="h6" align="center" style={{fontFamily: "MoonBold", color: "#E6E6E6"}}>  <b>Stripe</b> </Typography>
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", margin: 20}}> 
                        Stripe securely handles all payment processing in the application. The platform keeps reports on earnings, allows payouts to other connected accounts,
                        and makes it easy to create custom payment flows within the application.
                        Stripe takes 2.9% plus 30 cents per transaction, but has lower rates for companies making over $80,000 per month.
                        </Typography>
    
                        </Card>
                    </Grid>
                </Grid>
                <br />

                
            </div>
        )
    }
    
}