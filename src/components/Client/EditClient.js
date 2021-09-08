import React, { useState, useEffect } from 'react';
import firebase from "firebase/app"
import "firebase/firestore"

import GoogleMapReact from 'google-map-react';
import Geocode from "react-geocode";

import HomeIcon from '@material-ui/icons/Home';

import { Formik, Form } from 'formik';
import { Button, TextField, Typography, Grid, makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({

  confirm: {
    color: "green"
  },
  error: {
    color: "red"
  },
  name: {
    width: '60%',
    margin: 25
  },
  description: {
    width: '90%',
    }
}))

 
export default function EditClient(props) {

  Geocode.setApiKey("AIzaSyCqlMUtnbP4zqJ26Izex4TJ1h6j0aWgiKc");
  Geocode.setLanguage("en");
  Geocode.setRegion("us");

  const [lat, setLat] = useState(37)
  const [lng, setLng] = useState(-95)
  const [zoom, setZoom] = useState(1)

  const classes = useStyles()

  const handleUpload = (formData) => {

    console.log(formData)

    firebase.firestore().collection("clients").doc(props.clientId).update({
      name: formData.name,
      address: formData.address,
      email: formData.email,
      phone: formData.phone,
      lat: formData.lat,
      lng: formData.lng,
    })

    props.goBack()
      
    

  }

  const locateAddress = (address, setFieldValue) => {
    Geocode.fromAddress(address).then(
  (response) => {
    const { lat, lng } = response.results[0].geometry.location;
    console.log(lat, lng)
    setLat(lat)
    setLng(lng)
    setZoom(15)
    setFieldValue("lat", lat)
    setFieldValue("lng", lng)
  },
  (error) => {
    console.error(error)
  }
)
  }


  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    textAlign: "center",
  }


  return (

    <div style={uploadstyle}>
    <Formik
      initialValues = {{ 
        name: props.client.name,
        address: props.client.address,
        email: props.client.email,
        phone: props.client.phone,
        lat: props.client.lat,
        lng: props.client.lng

    }}

    validate = {values => {
      const errors = {}

      return errors
    }}


      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          handleUpload(values)
          setSubmitting(false)

        }, 400);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
        isSubmitting,
        setFieldValue
        /* and other goodies */
      }) => (
      <Form onSubmit={handleSubmit} autoComplete="off" >

        <Grid container>
          <Grid item sm={12} md={6} >
            <br />
            <TextField
            className={classes.name}
            onChange={handleChange}
            defaultValue={values.name}
            type="text"
            label="Name"
            name="name"
          />
          <br />

          <TextField
            className={classes.name}
            onChange={handleChange}
            defaultValue={values.address}
            type="text"
            label="Address"
            name="address"
          />
          <br />

          <TextField
            className={classes.name}
            onChange={handleChange}
            defaultValue={values.email}
            type="text"
            label="Email"
            name="email"
          />
          <br />

          <TextField
            className={classes.name}
            onChange={handleChange}
            defaultValue={values.phone}
            type="text"
            label="Phone"
            name="phone"
          />
          </Grid>
          <Grid item sm={12} md={6} >
            <br />
            <Button className={classes.buttonStyle} variant="contained" color="secondary" onClick={() => locateAddress(values.address, setFieldValue)}
        >Locate Address</Button>

        <div style={{ height: "50vh", width: "100%", padding: 20}}>
          <GoogleMapReact
            bootstrapURLKeys={{ key: "AIzaSyBiB3iNngJM_kFWKxSv9a30O3fww7YTiWA"}}
            center={{lat : lat, lng : lng}}
            zoom={zoom}
            onClick={(event) => {

              setFieldValue("lat", event.lat)
              setFieldValue("lng", event.lng)
              
            }}
          >

        <HomeIcon
              lat={values.lat}
              lng={values.lng}
            />

          </GoogleMapReact>
      </div>
          </Grid>
        </Grid>

        

      
      <br/>
      <br/>

      <Typography className={classes.error} > {errors.lat} </Typography>

      <br/>

      <Button type="submit" color="secondary" variant="contained" disabled={isSubmitting}> Update </Button>

      <br />
      <br />

      </Form>

      )}
    </Formik>
  </div>
)

}

