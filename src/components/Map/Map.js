import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import GoogleMapReact from 'google-map-react'

import Marker from "./Marker"
import Client from "../Client/Client"
import { Button, Modal, Card, Typography } from "@material-ui/core"
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
      zoom: 12,
      lat: 47.6,
      lng: -122.3,
      found: false,
      client: null,
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

    var width = this.state.zoom * 2

  

    return (
      <div>
        <div style={{ height: "60vh",  width: "100%"}}>
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
              return <Marker key={index} date={this.props.date} width={width} lat={client.lat} lng={client.lng} clientId={this.state.clientIds[index]} setClient={() => this.setState({client: this.state.clientIds[index]})}/>
            }) :  null }

            

            {this.state.found ? 
            <PersonPinCircleIcon lat={this.state.currentLoc.lat} lng={this.state.currentLoc.lng} style={{ width: width*2, height: width*2 }}/>
            :
            null
            }
          
          </GoogleMapReact>
          
          
        </div>

        

        {this.state.client ?
        <Modal 
        open={true} 
        onClose={() => this.setState({client: null})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div>
            <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({client: null})}> Back </Button>
            <Client products={this.props.products} checkout={this.props.checkout} date={this.props.date} clientId={this.state.client}/>
          </div>
          
        </Modal>
        
        :
        null
        }
        

      </div>
  )
  }
    
    
  
}

export default Map;

