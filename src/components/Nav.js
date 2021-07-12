import React from 'react';
import firebase from "firebase/app"

import { makeStyles } from '@material-ui/core/styles';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';

import AccountCircle from '@material-ui/icons/AccountCircle'
import AddIcon from '@material-ui/icons/Add';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import AssignmentIcon from '@material-ui/icons/Assignment';
import StorefrontIcon from '@material-ui/icons/Storefront';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';



const useStyles = makeStyles((theme) => ({
  speedDial: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1
  },
}));

export default function Nav(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  if (props.user) {
    return (
      <div className={classes.speedDial}>
          <SpeedDial
            ariaLabel="Nav"
            
            icon={<ExpandMoreIcon style={{width: 30, height: 30}} />}
            onClose={handleClose}
            onOpen={handleOpen}
            open={open}
            direction={"down"}
          >
            <SpeedDialAction
              icon={<AddIcon />}
              tooltipTitle={"New Client"}
              tooltipPlacement="left"
              onClick={() => props.setPage("NewClient")}
            />
              
            <SpeedDialAction
              icon={<ExitToAppIcon/>}
              tooltipTitle={"Logout"}
              tooltipPlacement="left"
              onClick={async () => {
                  await firebase.auth().signOut();
                }}
            />
          </SpeedDial>
      </div>
    )
  }
  else {
    return (
      <div>
          <SpeedDial
            ariaLabel="Nav"
            className={classes.speedDial}
            icon={<ExpandMoreIcon style={{width: 30, height: 30}} />}
            onClose={handleClose}
            onOpen={handleOpen}
            open={open}
            direction={"down"}
          >
            
            <SpeedDialAction
              icon={<AccountBoxIcon />}
              tooltipTitle={"Login"}
              tooltipPlacement="left"
              onClick={() => props.setPage("Auth")}
            />
          </SpeedDial>
      </div>
    )
  }

  
}
