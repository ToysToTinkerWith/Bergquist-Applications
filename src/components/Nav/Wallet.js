import React, { useState } from 'react';

import { Button, Typography, Grid, Card, Popover, Fab } from '@mui/material';

import AlgoConnect from "../Algo/AlgoConnect"

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import MenuIcon from '@mui/icons-material/Menu';



export default class Wallet extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            anchor: null,
            activeAddress: null,
            walletType: "",
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
        <div style={{padding: 20, paddingRight: 40}}>
            <Button
            variant="contained"
            style={{backgroundColor: "#FF6584", color: "#E6E6E6"}}
            onClick={this.handleClick} 
            >
                {this.state.activeAddress ?
                <Typography variant="body1" style={{fontFamily: "Chango", color: "#E6E6E6"}}> {this.state.activeAddress.slice(0, 10)} </Typography>
                :
                <Typography variant="body1" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Connect Wallet </Typography>
                }

           
          </Button>

            <Popover
              id={"popover1"}
              open={open}
              anchorEl={this.state.anchor}
              onClose={this.handleClose}
              onClick={this.handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
                <Card style={{backgroundImage: "linear-gradient(to top, #6C63FF, #FF6584)"}}>
                    <div style={{backgroundColor: "#3F3D56", margin: 10, borderRadius: 15}}> 
                        <AlgoConnect activeAddress={this.state.activeAddress} setActiveAddress={(account) => this.setState({activeAddress: account})} setWalletType={(wallet) => this.setState({walletType: wallet})} />
                    </div>

                
                </Card>
            </Popover>

        </div>
    )
    }

    
}


