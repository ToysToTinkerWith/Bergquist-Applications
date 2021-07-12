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
 
function EditJob(props) {

  const [progress, setProgress] = useState(0)
  const [pictures, setPictures] = useState([])

  const classes = useStyles()

  const handleUpdate = (formData) => {

    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(props.jobId).update({
      job: formData.job,
      details: formData.details,
      scheduled: formData.scheduled,
      estimate: formData.estimate
    })

    if (pictures.length > 0) {

      for (let y = 0; y < pictures.length; y++) {

      const uploadTask = storage.ref("images/" + props.clientId + "/" + props.jobId + "/" + pictures[y].name).put(pictures[y])

      uploadTask.on("state_changed", (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setProgress(progress)
      },
      (error) => {
        alert(error.message)
      },
      () => {
        firebase.storage().ref("images/" + props.clientId + "/" + props.jobId).child(pictures[y].name).getDownloadURL()
  .then(url => {
    console.log(url)
        firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(props.jobId).update({
          imgs: firebase.firestore.FieldValue.arrayUnion(url)
        })
    })
      })

    }

    
    }
      
    

  }


  const onDrop = (pictureFiles, pictureDataURLs) => {
    console.log(pictureFiles)
    console.log(pictureDataURLs)
    setPictures(pictureFiles)
  }

  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    paddingLeft: "10px",
    paddingRight: "10px",
    marginTop: "10px"
 
  }


  return (

    <div style={uploadstyle}>
    <Formik
      initialValues = {{ 
        job: props.job.job,
        details: props.job.details,
        estimate: props.job.estimate,
        scheduled: props.job.scheduled
    }}

    validate = {values => {
      const errors = {}

      return errors
    }}


      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          console.log(values)
          handleUpdate(values)
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
          defaultValue={props.job.job}
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
          defaultValue={props.job.details}
          rows={8}
          variant="outlined"
          
        />



        <TextField
          className={classes.input}
          onChange={handleChange}
          defaultValue={props.job.estimate}
          type="number"
          label="Estimate"
          name="estimate"
        />

      <br/>


      <TextField 
        name="scheduled"
        label="Schedule"
        type="date"
        className={classes.input}
        onChange={handleChange}
        defaultValue={props.job.scheduled}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <br/>
      <br/>
    
      <ImageUploader
        withIcon={false}
        withPreview={true}
        buttonText="Choose images"
        onChange={onDrop}
        imgExtension={[".jpg", ".png", ".jpeg"]}
        maxFileSize={10485760}
      />
      <CircularProgress variant="determinate" value={progress} />

      <br/>

      <Button type="submit" color="secondary" variant="outlined" disabled={isSubmitting}> Update </Button>

      <br />
      <br />

      </Form>

      

      )}
    </Formik>
  </div>
)

}



export default EditJob