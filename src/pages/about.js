
import React from "react"


import Head from "next/head"

import { Typography, Card, Grid, TextField, Button, Avatar } from "@mui/material"

export default class About extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            
        }
        this.handleChange = this.handleChange.bind(this)
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
            <div style={{padding: 20}}>
                <Head>
                    <title>About</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Bergquist Applications is a product of independant web development research. Years of practice in building applications with modern web technologies, that serve use cases on every level. Progressive means that the business will evolve to fit best practices in modern web development." />
                    <meta name="keywords" content="Message, Phone, Email, Functional Architecture, Funtional Build, Design Architecture, Design Build" />
                    
                    <meta property="og:url" content="https://andersbergquist.com/about" key="ogabouturl" />
                    <meta property="og:title" content="About" key="ogabout" />
                    <meta property="og:description" content="Bergquist Applications is a product of independant web development research. Years of practice in building applications with modern web technologies, that serve use cases on every level. Progressive means that the business will evolve to fit best practices in modern web development." key="ogaboutdesc" />
                </Head>
                
                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10,
                    marginBottom: 20
                }}
                >
                                        <br />

                    <Grid container alignItems="center" >
                                <Grid item xs={12} sm={6} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}}>
                                    
                                    <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> About me </Typography>
                                    <img src="/Anders.jpg" style={{display: "flex", margin: "auto", marginTop: 40, marginBottom: 40,  width: "60%", height: "auto",  borderRadius: 5000, border: "5px solid #FF6584"}} />
                                    <Typography variant="h6" align="center" color="secondary" style={{color: "#E6E6E6", fontFamily: "MoonBold", paddingLeft: 40, paddingRight: 40, paddingBottom: 40}}> Anders Bergquist </Typography>
    
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={6} >
                                        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                        My name is <b>Anders Bergquist</b>. I am a bachelor in computer science with a passion for building web applications and websites. From years of experience in the field, I have learned the importance of building robust, scalable, and user-friendly applications. I have recently decided to start my own company, Bergquist Applications, where I can work with business partners, to deliver on web applications that exceed their expectations. In continuing to research and develop new technologies, I am eager to work with you to deliver the best possible experience for your business or personal needs. 
     
                                        </Typography>
    
                                        
                                        
    
    
                                    </Grid>
                                  
                                    
                                </Grid>
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                        I started this business because I came upon some of the best web frameworks that exist in development today. With the help of so many great tools, I can offer a complete custom interaction between the frontend application, and the servers. The server that Firebase offers is owned by Google, and has industry leading performance in backend mangement. You will be added as an owner to this server which will give you a dashboard to view all your user authentication, database collections, hosting information, and analytics to keep to track of website performance.
                                        </Typography>
    
                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                Bergquist Applications is a single-person company. I take full responsibilty for the functionality of your application. If the product is not to your liking, then we will make the necessary adjustments to deliver the desired experience. The goal is to build a product that exceeds your expectations, and I am excited to work with you to get there. 
                                </Typography>
                                <br />
                                <img src="/AndersBergquist.svg" style={{display: "flex", margin: "auto", marginTop: 40, marginBottom: 40, width: "100%", height: "auto", maxHeight: 100}} />

                    
    
                </Card>

                <Card style={{
                    backgroundColor: "#3F3D56",
                    borderRadius: "15px",
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                    padding: 10
                }}
                >
                                        <br />

                                    
                                    
    
                                    <Grid container alignItems="center">
                                        <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}}>
                                        <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> My Services </Typography>
                                        <img src="/WebApps.svg" style={{display: "flex", margin: "auto", marginTop: 40, marginBottom: 40,  width: "60%", height: "auto"}} />

                                        <Typography variant="h5" align="center" color="secondary" style={{color: "#E6E6E6", fontFamily: "MoonBold", paddingLeft: 40, paddingRight: 40, paddingBottom: 40}}> Web Applications </Typography>
                                        
        
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={6} >
                                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                            Web applications can be accessed by any device with an internet connection. With the ability to create fully immersive, web-based experiences, Bergquist Applications can design and deliver the solution that best fits your needs and budget. This includes custom user interfaces, custom payment methods, custom forms, themes, and a beautiful backend UI to manage and analyze all your application data. 
        
                                            </Typography>
        
                                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                            Whatever it is, whether it be a showcase website, a content management for your business, a way to accept online payments, or maybe a combination of everything, Bergquist Applications can build it. We specialize in custom web development and can build whatever you can imagine, from a simple website to a full-blown online business. We’ll build the system that fits your budget and your needs, and we’ll build it to last. Our custom web development services are backed by years of experience and the latest in web development tools.

                                            </Typography>
        
                                            
        
        
                                        </Grid>
                                  
                                    
                                    </Grid>
                                <br />

                                


                                    <Grid container alignItems="center">
                                        <Grid item xs={12} sm={12} md={6} style={{backgroundImage: "url('BusinessAuto.svg')", backgroundSize: "cover"}}>
                                        <img src="/Tutoring.svg" style={{display: "flex", margin: "auto", marginTop: 40, marginBottom: 40,  width: "60%", height: "auto"}} />

                                        <Typography variant="h5" align="center" color="secondary" style={{color: "#E6E6E6", fontFamily: "MoonBold", paddingLeft: 40, paddingRight: 40, paddingBottom: 40}}> Web Tutoring  </Typography>

        
                                        </Grid>
                                        <Grid item xs={12} sm={12} md={6} >
                                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                            I also offer web tutoring to anyone interested in learning how to build full-stack web applications. I teach frontend skills, such as responsive design and animation, through a component-based approach. This means that you will build components, such as a form, and learn how to combine them to create sophisticated interfaces. With these interfaces, I will show you how to interact with the backend API, so that you can integrate your user authentication, cloud database, file storage, payment infrastructure, and so on.
        
                                            </Typography>
        
                                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                            Whether you are a begginer in web development or a advanced developer looking to expand your skill set, I am here to help you build a strong foundation. You are going to love the tools I use and how they work together. I will teach you how to use the tools that will allow you to build an app that is fully customized to your needs. And if you ever get stuck, I can help you through the process, and you can even ask me questions by text, email, or call. I look forward to building Web Applications with you! 

                                            </Typography>
        
                                            
        
        
                                        </Grid>
                                  
                                    
                                    </Grid>
                                <br />

                                <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
                                Please call, text, or email me at my contact information below. Let me know the needs of your web application, or if you would like to schedule a tutoring session. I am open to any conversation about web development.
                                </Typography>

                                <Grid container>
                                    <Grid item xs={12} sm={12} md={6} style={{padding: "5%"}}>
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
                                    <Grid item xs={12} sm={12} md={6} style={{padding: "5%"}}>
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

    
                </Card>

                
                
                
            </div>
            
        )
      }

    
}