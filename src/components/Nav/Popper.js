import React, { useState, useEffect } from 'react';

import { Button, Typography, Grid, Card, Popover, Fab } from '@material-ui/core';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import MenuIcon from '@mui/icons-material/Menu';



export default function WhatWeDo(props) {

    const [anchor, setAnchor] = useState(null)

    const handleClick = (event) => {
        setAnchor(event.currentTarget);
      };

    const handleClose = () => {
        setAnchor(null);
    };

    const open = Boolean(anchor);

    return (
        <div style={{padding: 20, zIndex: 5000}}>
            <Fab
            style={{backgroundColor: "#3F3D56", color: "#E6E6E6"}}
            onClick={handleClick} 
            >
              <img src="/Moon.svg" style={{width: "100%"}} />
           
          </Fab>

            <Popover
              id={"popover1"}
              open={open}
              anchorEl={anchor}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
                <Card style={{backgroundImage: "linear-gradient(to top, #6C63FF, #FF6584)"}}>
                    <div style={{backgroundColor: "#3F3D56", margin: 10, borderRadius: 15}}> 
                        <ListItem>
                            <Button href="/" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{color: window.location.pathname == "/" ? "#6C63FF" : "#E6E6E6"}}> <b>About</b>  </Typography>
                        </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/components" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{color: window.location.pathname == "/components" ? "#6C63FF" : "#E6E6E6"}}> <b>Components</b>  </Typography>
                            </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/projects" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{color: window.location.pathname == "/projects" ? "#6C63FF" : "#E6E6E6"}}> <b>Projects</b>  </Typography>
                            </Button>
                        </ListItem>
                        <ListItem>
                            <Button href="/contact" style={{textTransform: "none", width: "100%"}}>
                            <Typography variant="body1" style={{color: window.location.pathname == "/contact" ? "#6C63FF" : "#E6E6E6"}}> <b>Contact</b>  </Typography>
                            </Button>
                        </ListItem>
                    </div>

                
                </Card>
            </Popover>

        </div>
    )
}


