import React, { useState } from "react"

import { Card, Typography, Button, TextField, Grid } from "@mui/material"

import Typewriter from "./typewriter"

import LiveHelpIcon from '@mui/icons-material/LiveHelp';

import { motion } from "framer-motion"

import { useRouter } from 'next/router'


export default function Chat(props) { 

    const [expand, setExpand] = useState(false)

    const [prompt, setPrompt] = useState("Hello")
    const [response, setResponse] = useState("Hello, how can I help you today?")

    const [loading, setLoading] = useState(true)

    const router = useRouter()
    
    React.useEffect(() => {

       

    }, [])

    const askModel = async (ask) => {

        setResponse("")
        setPrompt(ask)

        let type

        if (router.pathname.substring(0,9) == "algorand") {
            type = "algorand"
        }
        else {
            type = "normal"
        }
       
        let response = await fetch('/api/customModel', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: ask,
                type: type
                
            }),
            
              
          });
  
          let session = await response.json()

         
          setResponse(session.response)

    
    }

    const handlePromptChange = (event) => {

        const target = event.target;
        let value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        if (name == "prompt") {
            setPrompt(value.replace(/(\r\n|\n|\r)/gm,""))
        }
    
    }

    const onKeyPress = (e) => {
        if(e.keyCode == 13){
            askModel(prompt)
         }
    }


        return (
            <div>
                
                <div style={{width: "100%", padding: 20}}>
                    
                    {router.pathname.substring(0,9) == "/algorand" ?
                        <Grid container>
                        <Grid item xs={12} sm={3} >
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("What is Bergquist Applications?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    What is Bergquist Applications?
                                </Typography>
                            </Button>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("What is Algorand?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    What is Algorand?
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("How can I contact Bergquist Applications?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    How can I contact Bergquist Applications?
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("What are smart contracts?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                What are smart contracts?
                                </Typography>
                            </Button>
                        </Grid>

                    </Grid>
                    :
                    <Grid container>
                        <Grid item xs={12} sm={3} >
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("What is Bergquist Applications?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    What is Bergquist Applications?
                                </Typography>
                            </Button>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("What is modern web development?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    What is modern web development?
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("How can I contact Bergquist Applications?")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                    How can I contact Bergquist Applications?
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button style={{textTransform: "none", margin: 20}} variant="contained" color="primary" onClick={() => askModel("Explain the different technologies used in Bergquist Applications")}>
                                <Typography align="center" variant="subtitle2" style={{color: "#E6E6E6"}}>
                                Explain the different technologies used in Bergquist Applications
                                </Typography>
                            </Button>
                        </Grid>

                    </Grid>
                    }
                    
    
                    <br />
                     
                    <TextField                
                    onChange={handlePromptChange}
                    onKeyDown={onKeyPress}
                    value={prompt}
                    multiline
                    type="text"
                    name="prompt"
                    autoComplete="false"
                    InputProps={{ style: { color: "black" } }}
                    style={{
                    color: "black",
                    background: "white",
                    borderRadius: 15,
                    display: "flex",
                    margin: "auto",
                    width: "80%"
                    }}
                    />
                    <br />
                    <Button variant="contained" color="primary" 
                    onClick={() => askModel(prompt)}
                    >
                        Ask
                    </Button>
                    {loading && response == "" ?
                    <motion.img animate={{opacity: [0,1,0]}} transition={{duration: 3, repeat: Infinity}} src={"/RocketAlgo.svg"} style={{width: 60, display: "flex", margin: "auto", marginTop: 40}} />
                    :
                    null
                    }
                    <Typewriter style={{margin: 10}} text={response} delay={20} />
                </div>
                

            </div>
        )
  
    
    
    
    
}