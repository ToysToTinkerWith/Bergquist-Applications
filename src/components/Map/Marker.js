import React from "react"

import { Avatar, IconButton } from "@material-ui/core"
import HomeIcon from '@material-ui/icons/Home';
function Marker(props) {

    let adoptstyle = {
      color: "red",
      width: props.width,
      height: props.width
    }

    return (
      <div>
        <IconButton onClick={() => [props.setClient(props.clientId), props.setPage("Client")]} >
          <HomeIcon style={adoptstyle}/>
        </IconButton>
      </div>
    )
      

  }


export default Marker