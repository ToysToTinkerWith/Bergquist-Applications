import React, { useState } from 'react';

import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"


import { Formik, Form } from 'formik';
import { Button, TextField, CircularProgress, makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({

  input: {
    margin: theme.spacing(3),
    width: '70%'
  }
}))
 
function NewJob(props) {

  const [progress, setProgress] = useState(0)
  const [pictures, setPictures] = useState([])

  const classes = useStyles()

  const handleUpload = (formData) => {

    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").add({
      job: formData.job,
      details: formData.details,
      scheduledFrom: formData.scheduledFrom,
      scheduledTo: formData.scheduledTo,
      estimate: formData.estimate,
      imgs: [],
      status: "Waiting for client approval...",
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(doc) {

      if (pictures.length > 0) {

        for (let y = 0; y < pictures.length; y++) {

        const uploadTask = firebase.storage().ref("images/" + props.clientId + "/" + pictures[y].id).put(pictures[y])

        uploadTask.on("state_changed", (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          setProgress(progress)
        },
        (error) => {
          alert(error.message)
        },
        () => {

          firebase.storage().ref("images/" + props.clientId).child(pictures[y].id).getDownloadURL()
  .then(url => {
    console.log(url)
        firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(doc.id).update({
          imgs: firebase.firestore.FieldValue.arrayUnion(url)
        })
    })

        })

      }
      }

      })
      
    

  }


  const handlePicture = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const newImage = e.target.files[i];
      newImage["id"] = Math.random().toString(20);
      setPictures((prevState) => [...prevState, newImage]);
    }
  };

  const uploadstyle = {
    backgroundColor: "#3F3D56",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    textAlign: "center"
 
  }


  return (

    <div style={uploadstyle}>
    <Formik
      initialValues = {{ 
        job: "",
        details: "",
        estimate: "",
        scheduledFrom: "",
        scheduledTo: ""
    }}

    validate = {values => {
      const errors = {}

      return errors
    }}


      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          console.log(values)
          handleUpload(values)
          props.goBack()
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
      
        <TextField
          className={classes.input}
          onChange={handleChange}
          type="text"
          label="Job"
          name="job"
        />


      <br/>


      <TextField
          label="Details"
          name="details"
          multiline
          className={classes.input}
          onChange={handleChange}
          rows={8}
          variant="outlined"
          
        />

        <TextField
          className={classes.input}
          onChange={handleChange}
          type="number"
          label="Estimate $"
          name="estimate"
        />

      <br/>


      <TextField 
        name="scheduledFrom"
        label="From"
        type="datetime-local"
        className={classes.input}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
      />

        <TextField
        name="scheduledTo"
        label="To"
        type="datetime-local"
        className={classes.input}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <br/>
      <br/>
        
      <Button variant="contained" component="label" style={{display: "block"}}>
      <input type="file" multiple onChange={handlePicture} />

      </Button>

      <br />
      <CircularProgress variant="determinate" value={progress} />

      <br/>

      <Button type="submit" color="secondary" variant="outlined" disabled={isSubmitting}> Upload </Button>

      <br />
      <br />

      </Form>

      )}
    </Formik>
  </div>
)

}



export default NewJob