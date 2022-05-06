
import React, { useEffect } from "react"

import Head from "next/head"

import { Typography, Card, Grid, Button } from "@mui/material"

export default class Pricing extends React.Component{
    

    render() {
        return (
            <div style={{padding: 20}}>
                <Head>
                    <title>Pricing</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Pricing is based on both the functionality and design of the application." />
                    <meta name="keywords" content="Pricing, Web Application, Web Tutoring, Budget, Needs." />
                    
                    <meta property="og:url" content="https://andersbergquist.com/pricing" key="ogpricingurl" />
                    <meta property="og:title" content="Pricing" key="ogpricing" />
                    <meta property="og:description" content="Pricing is based on both the functionality and design of the application." key="ogpricingdesc" />
                    </Head>
                
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 20
                }}
                >
                    <Grid container alignItems="center">
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Pricing </Typography>
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20, paddingLeft: 40, paddingRight: 40 }}> Web Application Development </Typography>
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6",  paddingLeft: 40, paddingRight: 40 }}> $40/hr </Typography>

                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    The cost of a Bergquist Application depends on the scope of the project. You will get a quote based on the features that you want to include in your application, and the aesthetic design. I will provide you with a detailed estimate, based on the time I believe it will take to complete the project. Often times projects will be broken down into multiple stages, and we will check to make sure that each stage is completed to the satisfaction of the client. This way, you can review the work along the way and provide input on the direction of the project.
                                    
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}}>
                                        
                                    <img src="./WebPricing.svg" alt="Design" style={{display: "flex", margin: "auto", width: "100%", maxHeight: 400, padding: 10}}/>

                                    </Grid>
                                    
                                </Grid>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                As an independent developer, I am able to provide affordable custom application development for small and large-scale projects. I take pride in providing clear communication and detailed estimates for my work. I will work closely with you to ensure that your application is developed the way you envisioned. 
                                    
                                </Typography>

                                

                                <Grid container alignItems="center">
                                <Grid item xs={12} sm={12} md={6}>
                                    <br />
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20, paddingLeft: 40, paddingRight: 40 }}> Web Application Tutoring </Typography>
                                    <Typography variant="h5" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6",  paddingLeft: 40, paddingRight: 40 }}> $40/hr </Typography>

                                    <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                    Bergquist Applications is teaching it's own methods of application development. I will provide you with the tools you need to create custom full-stack web applications. Depending on your experience level in modern web development, I will pick the right path forward for you to get your application up and running. I hope to keep a great relationship with you, one developer to another, and build each other up as we work together to build a better web.
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}} >
                                        
                                    <img src="./TutorPricing.svg" alt="Design" style={{display: "flex", margin: "auto", width: "100%", maxHeight: 400, padding: 10}}/>

                                    </Grid>
                                    
                                </Grid>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                The first hour of my tutoring session is free, so you can get a feel for how I teach, and get a general idea of what you can expect. I strongly believe in the stack: Next.js, Material-UI,  Firebase, and Stripe, to be a great foundation for building web applications that are future-proof. If you are interesting in learning how to build a web applications, please contact me. I look forward to working with you!

                                </Typography>
                    
    
                </Card>

                
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 20
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