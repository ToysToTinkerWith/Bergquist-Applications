import React, { useState, useEffect } from 'react';

import { Button, Typography, Grid, Popover } from '@material-ui/core';

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
        <div style={{padding: 20}}>
            <Button
            variant="text"
            style={{color: "#E6E6E6"}}
            onClick={handleClick} 
            >
              <MenuIcon />
           
          </Button>

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
                <List>
                <ListItem>
                    <ListItemButton onClick={() => [props.setPage("About"), handleClose()]}>
                    <ListItemText primary="About" />
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton onClick={() => [props.setPage("Components"), handleClose()]}>
                    <ListItemText primary="Components" />
                    </ListItemButton>
                </ListItem>
                <ListItem>
                    <ListItemButton onClick={() => [props.setPage("Process"), handleClose()]}>
                    <ListItemText primary="Process" />
                    </ListItemButton>
                </ListItem>
                </List>
            </Popover>

        </div>
    )
}


