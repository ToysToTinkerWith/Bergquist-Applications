import React, {useState, useEffect} from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { collection, onSnapshot } from "firebase/firestore"

import { IconButton } from "@material-ui/core"
import HomeIcon from '@material-ui/icons/Home';

function Marker(props) {

  const [markerColor, setMarkerColor] = useState("")

  useEffect(() => {

    const jobRef = collection(db, "clients", props.clientId, "jobs")

    const unsub = onSnapshot(jobRef, (jobSnap) => {

      let color = "#66bb6a"

      jobSnap.forEach((job) => {

        const jobDateFrom = new Date(job.data().scheduledFrom)
        const jobDateTo = new Date(job.data().scheduledTo)
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