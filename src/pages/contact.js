
import React, { useEffect } from "react"

import Head from "next/head"

import { Typography, Card, Grid, Button } from "@mui/material"

export default class Contact extends React.Component{
    

    render() {
        return (
            <div style={{padding: 20}}>
                <Head>
                    <title>Contact</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement." />
                    <meta name="keywords" content="Message, Phone, Email, Functional Architecture, Funtional Build, Design Architecture, Design Build" />
                    
                    <meta property="og:url" content="https://andersbergquist.com/content" key="ogcontenturl" />
                    <meta property="og:title" content="Content" key="ogcontent" />
                    <meta property="og:description" content="Help Bergquist Applications understand the business model, and budget, to explore affordable options for improvement." key="ogcontentdesc" />
                    </Head>
                
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 40
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
                                        <Grid item xs={12} sm={6} md={12} lg={6} style={{padding: "5%"}}>
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
                                        <Grid item xs={12} sm={6} md={12} lg={6} style={{padding: "5%"}}>
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
                    marginBottom: 40
                }}
                >
                    <Grid container >
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <br />
                        <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Functional Architecture </Typography>
    
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                        Join Bergquist Applications in a collaborative <b>FigJam File</b>, where marketers, designers, and developers come together, to design a custom data model for the company.
                        Highlighting stages where customers can interact with the app, what data is captured from each process, and important use cases for the company.
                        Be hands on throughout the process and work with Bergquist Applications, in creating a flow representation that will save the business time, and store useful data for the future.
                        </Typography>
                        
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={6}>
                        <Button variant="contained" color="secondary" style={{fontFamily: "MoonBold", color: "#FFFFFF", margin: 20}} href="https://www.figma.com/file/9Bmlo5GB3CD9TqktEOiFae/Diagramming-basics-(Community)" > FigJam File </Button>
                            <img src="./DesignProcess.svg" alt="Design" style={{display: "flex", margin: "auto", width: "100%", verticalAlign: "middle", maxHeight: 250, padding: 10}}/>
                        </Grid>
                        
                    </Grid>
                    <br />
                                <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Functional Build </Typography>
                                
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                Everything laid out in the functional architecture, will be implemented in code. This builds the application with all the backend features,
                                including the cloud database, user authentication, and payment processing. A deployment link is provided to view the app as it gets developed, encouraging the business to test out features soon after they get added.
                                Projects are broken down into smaller builds, that can be developed and paid off separately, and businesses can move forward at their own pace. With each phase brings new conversations, and we never move
                                on until all parties are satisfied.
                                </Typography>
                        
                       
                    
    
                </Card>
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 40
                }}
                >
                    <Grid container >
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <br />
                        <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Design Architecture </Typography>
                        
                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                        In a <b>Figma Design File</b>, Bergquist Applications and the business get to share design ideas, on how to market the business, and how to guide users towards the right product for them. We have our own graphics libraries and
                        tools to generate content, but hope to collaborate within the business for direction. This cost will be minimal depending on how involved the company is with supplying design assets. 
                        </Typography>
                        
    
                        </Grid>
                        <Grid item xs={12} sm={12} md={12} lg={6}>
                        <Button variant="contained" color="secondary" style={{fontFamily: "MoonBold", color: "#FFFFFF", margin: 20}} href="https://www.figma.com/file/X44kf59bL8tK9Gmsuu0LJt/Wireframing-in-Figma" > Figma Design File </Button>
                            <img src="./WireFraming.svg" alt="Design" style={{display: "flex", margin: "auto", width: "100%", verticalAlign: "middle", maxHeight: 250, padding: 10}}/>
                        </Grid>
                        
                    </Grid>
                    <br />
                            <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Design Build </Typography>
                           
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                            Once everyone is happy with the feel and layout of the design architecture, we code it into the build to be responsive to all screen sizes. Choosing to animate certain aspects of the design file
                            adds complexity, but is effective in communicating ideas and captivating the audience. All builds can be incrementally scaled in size and complexity, and as the business evolves, upgrades can be made to
                            improve on existing features. Bergquist Applications is here to make sure each business capitalizes on all the lastest tech, in the ever expanding internet space.
                            </Typography>
                                            
                     
                    
    
                </Card>
                
            </div>
            
        )
    }
    
}