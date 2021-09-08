import React, {useState, useEffect} from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import { IconButton } from "@material-ui/core"
import HomeIcon from '@material-ui/icons/Home';

function Marker(props) {

  const [markerColor, setMarkerColor] = useState("")

  useEffect(() => {
    
    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").onSnapshot((query) => {

      let color = "#66bb6a"

      query.forEach(doc => {
        let job = doc.data()
        const jobDateFrom = new Date(job.scheduledFrom)
        const jobDateTo = new Date(job.scheduledTo)
        if (props.date > jobDateTo) {
          if (color != "#ffee58" || color != "#42a5f5") {
            color = "#66bb6a"
          }
        }

        else if (props.date > jobDateFrom.setHours(0)) {
          color = "#ffee58"
        }
        else {
          if (color !== "#ffee58") {
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
        <IconButton onClick={() => props.setClient()} >
          <HomeIcon style={markerstyle}/>
        </IconButton>
      </div>
    )
      

  }


export default Marker