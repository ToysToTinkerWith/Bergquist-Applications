import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import GoogleMapReact from 'google-map-react'
import Marker from "./Marker"
import { Fab } from "@material-ui/core"
import PersonPinCircleIcon from '@material-ui/icons/PersonPinCircle';

const getMapOptions = (maps) => {

  return {
      streetViewControl: true,
      scaleControl: true,
      fullscreenControl: false,
      
      gestureHandling: "greedy",

      mapTypeControl: true,
      mapTypeId: maps.MapTypeId.SATELLITE,
      mapTypeControlOptions: {
          style: maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: maps.ControlPosition.TOP_LEFT,
          mapTypeIds: [
              maps.MapTypeId.ROADMAP,
              maps.MapTypeId.SATELLITE,
              maps.MapTypeId.HYBRID
          ]
      },

      zoomControl: true,
      clickableIcons: false
  };
}

class Map extends React.Component {

   constructor() {
    super()
    this.state = {
      clients: [],
      clientIds: [],
      zoom: 10,
      lat: 48.2,
      lng: -122.5,
      found: false,
      currentLoc: {
        lat: 0,
        lng: 0
      }
    }
    this.getUserLocation = this.getUserLocation.bind(this)
  }

  componentDidMount() {
    firebase.firestore().collection("clients").onSnapshot(snapshot => {

      snapshot.forEach(doc => {
        this.setState(prevState => ({
          clients: [...prevState.clients, doc.data()],
          clientIds: [...prevState.clientIds, doc.id]
        }))
      })

    })

  }

  getUserLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      this.setState({
        zoom: 15,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        found: true,
        currentLoc: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
      })
    })
  }


  render() {

    var width = this.state.zoom

    return (
      <div>
        <div style={{ height: "100vh",  width: "100%" }}>
          <GoogleMapReact
            bootstrapURLKeys={{ key: "AIzaSyBiB3iNngJM_kFWKxSv9a30O3fww7YTiWA"}}
            options={getMapOptions}
            center={{lat: this.state.lat, lng: this.state.lng}}
            zoom={this.state.zoom}        
            onChange={({ zoom, center }) => {
              this.setState({
                zoom: zoom,
                lat: center.lat,
                lng: center.lng
              })
            }
            }    
          >

            {this.state.clients.length > 0 ? this.state.clients.map((client, index) => {
              return <Marker key={index} date={this.props.date} width={width} user={this.props.user} zoom={this.state.zoom} lat={client.lat} lng={client.lng} clientId={this.state.clientIds[index]} setPage={this.props.setPage} setClient={this.props.setClient}/>
            }) :  null }

            {this.state.found ? 
            <PersonPinCircleIcon lat={this.state.currentLoc.lat} lng={this.state.currentLoc.lng} style={{ width: width/2, height: width/2 }}/>
            :
            null
            }
          
          </GoogleMapReact>
          <Fab  color="primary" 
                tooltip="Location"
                style={{position: "absolute", top: 5, right: 75}}
                onClick={() => this.getUserLocation()}>
          <PersonPinCircleIcon />
          </Fab>
        </div>
        

      </div>
  )
  }
    
    
  
}

export default Map;

