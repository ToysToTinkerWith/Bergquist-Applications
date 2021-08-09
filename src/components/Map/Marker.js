import React, {useState, useEffect} from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import { IconButton } from "@material-ui/core"
import HomeIcon from '@material-ui/icons/Home';

function Marker(props) {

  const [markerColor, setMarkerColor] = useState("")

  useEffect(() => {
    
    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").onSnapshot((query) => {

      let color

      query.forEach(doc => {
        let job = doc.data()
        const jobDateFrom = new Date(job.scheduledFrom)
        const jobDateTo = new Date(job.scheduledTo)

        if (job.status == "Waiting for client approval..." || 
        job.status == "Job recieved, awaiting approval...") {
          color = "#f5f5f5"
        }

        else if (props.date > jobDateTo) {
          if (color !== "#42a5f5" && color !== "#ef5350") {
            color = "#66bb6a"
          }
        }
        else if (props.date > jobDateFrom.setHours(0)) {
          color = "#ef5350"
        }
        else {
          if (color !== "#ef5350") {
            color = "#42a5f5"
          }
        }
      })

      setMarkerColor(color)
    })
    

  })

    let markerstyle = {
      color: markerColor,
      border: "2px solid " + markerColor, 
      borderRadius: 15,
      width: props.width, 
      height: props.width
    }


    return (
      <div>
        <IconButton  onClick={() => [props.setPage("Client"), props.setClient(props.clientId)]} >
          <HomeIcon style={markerstyle}/>
        </IconButton>
      </div>
    )
      

  }


export default Marker