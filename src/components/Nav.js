import React from 'react';
import firebase from "firebase/app"

import { makeStyles } from '@material-ui/core/styles';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';

import SentimentSatisfiedAltIcon from '@material-ui/icons/SentimentSatisfiedAlt';
import RecentActorsIcon from '@material-ui/icons/RecentActors'
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';


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
              icon={<RecentActorsIcon />}
              tooltipTitle={"Clients"}
              tooltipPlacement="left"
              onClick={() => props.setPage("Clients")}
            />

            <SpeedDialAction
              icon={<SentimentSatisfiedAltIcon />}
              tooltipTitle={"New Employee"}
              tooltipPlacement="left"
              onClick={() => props.setPage("NewEmployee")}
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
