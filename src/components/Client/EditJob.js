import React, { useState } from 'react';

import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"

import { Formik, Form } from 'formik';
import { Button, IconButton, TextField, Avatar, CircularProgress, makeStyles } from '@material-ui/core'

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';


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

    console.log(pictures)

    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(props.jobId).update({
      job: formData.job,
      details: formData.details,
      scheduledFrom: formData.scheduledFrom,
      scheduledTo: formData.scheduledTo,
      estimate: formData.estimate
    })

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
        firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(props.jobId).update({
          imgs: firebase.firestore.FieldValue.arrayUnion(url)
        })
    })
      })

    }

    
    }
      
    

  }

  const handlePicture = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const newImage = e.target.files[i];
      newImage["id"] = Math.random().toString(20);
      setPictures((prevState) => [...prevState, newImage]);
    }
  }

  const deleteImg = (index) => {

    const imgs = props.job.imgs

    imgs.splice(index, 1)

    firebase.firestore().collection("clients").doc(props.clientId).collection("jobs").doc(props.jobId).update({
      imgs: imgs
    })

  }


  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    textAlign: "center"
 
  }


  return (

    <div style={uploadstyle}>
    <Formik
      initialValues = {{ 
        job: props.job.job,
        details: props.job.details,
        estimate: props.job.estimate,
        scheduledFrom: props.job.scheduledFrom,
        scheduledTo: props.job.scheduledTo

    }}

    validate = {values => {
      const errors = {}

      return errors
    }}


      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          console.log(values)
          handleUpdate(values)
          props.setEdit()
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
      <br />

        {props.job.imgs.length > 0 ?
        props.job.imgs.map((img, index) => {
          return (
            <div style={{display: "inline-block", border: "1px solid black", borderRadius: 5, margin: 5}}>
              <Avatar src={img} alt="img" style={{height: 75, width: 75}}/>
              <IconButton onClick={() => deleteImg(index)}>
                <DeleteIcon />
              </IconButton>   
            </div>

                
          )
          
            })
          :
          null
          }

      <br />

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