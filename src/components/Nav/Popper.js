import React, { useState } from 'react';

import { Button, Typography, Grid, Card, Popover, Fab } from '@mui/material';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import MenuIcon from '@mui/icons-material/Menu';



export default class WhatWeDo extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            anchor: null
        }
        this.handleClick = this.handleClick.bind(this)
        this.handleClose = this.handleClose.bind(this)
    }

    handleClick = (event) => {
        this.setState({
            anchor: event.currentTarget
        })
      };

    handleClose = () => {
        this.setState({
            anchor: null
        })
    };

    render() {
    
    const open = Boolean(this.state.anchor);

    return (
        <div style={{padding: 20, paddingRight: 40, zIndex: 5}}>
            <Fab
            variant="circular"
            style={{backgroundColor: "#3F3D56", color: "#E6E6E6"}}
            onClick={this.handleClick} 
            >
              <img src="/Moon.svg" style={{width: "100%"}} />
           
          </Fab>

            <Popover
              id={"popover1"}
              open={open}
              anchorEl={this.state.anchor}
              onClose={this.handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
                <Card style={{backgroundImage: "linear-gradient(to top, #6C63FF, #FF6584)"}}>
                    <div style={{backgroundColor: "#3F3D56", margin: 10, borderRadius: 15}}> 
                        <ListItem>
                            <Button href="/" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/" ? "#6C63FF" : "#E6E6E6"}}> <b>Home</b>  </Typography>
                        </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/about" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/about" ? "#6C63FF" : "#E6E6E6"}}> <b>About</b>  </Typography>
                        </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/components" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/components" ? "#6C63FF" : "#E6E6E6"}}> <b>Components</b>  </Typography>
                            </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/applications" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/applications" ? "#6C63FF" : "#E6E6E6"}}> <b>Applications</b>  </Typography>
                            </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/pricing" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/pricing" ? "#6C63FF" : "#E6E6E6"}}> <b>Pricing</b>  </Typography>
                            </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/contact" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{fontFamily: "MoonBold", color: window.location.pathname == "/contact" ? "#6C63FF" : "#E6E6E6"}}> <b>Contact</b>  </Typography>
                            </Button>
                        </ListItem>
                    </div>

                
                </Card>
            </Popover>

        </div>
    )
    }

    
}


