import React, { useState } from 'react';
import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"

import { Formik, Form } from 'formik';
import { Button, Typography, TextField, Input, CircularProgress, makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  
  root: {
      margin: theme.spacing(3),
      width: "90%"
  },
  confirm: {
    color: "green"
  },
  error: {
    color: "red"
  },
}))
 
function EditProfile(props) {

  const [progress, setProgress] = useState(0)
  const [confirm, setConfirm] = useState("")

  const classes = useStyles()

  const handleUpload = (formData) => {

    if (formData.image) {
      setConfirm("Uploading...")

      const uploadTask = firebase.storage().ref("images/" + formData.image.name + "-" + props.user.uid).put(formData.image)

      uploadTask.on("state_changed", (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setProgress(progress)
      },
      (error) => {
        alert(error.message)
      },
      () => {
        setConfirm("Update success")
        firebase.storage().ref("images").child(formData.image.name + "-" + props.user.uid).getDownloadURL().then(url => {
          firebase.firestore().collection("profiles").where("uid", "==", props.user.uid)
          .get()
          .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  firebase.firestore().collection("profiles").doc(doc.id).update({
                    imageUrl: url,
                    bio: formData.bio
                  })
              })

          })
          .catch(function(error) {
              console.log("Error getting documents: ", error)
          })
              })

            }
        )
    }
    else {
      firebase.firestore().collection("profiles").where("uid", "==", props.user.uid)
          .get()
          .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  console.log(doc.id, " => ", doc.data())
                  firebase.firestore().collection("profiles").doc(doc.id).update({
                    bio: formData.bio
                  })
              })

          })
          .catch(function(error) {
              console.log("Error getting documents: ", error)
          })

    }
  }


  const signupstyle = {
      backgroundColor: "#FFFFF0",
      borderRadius: "15px",
      boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
      paddingLeft: "10px",
      paddingRight: "10px",
      textAlign: "center"
  }

  return (

    <div style={signupstyle}>
    <Formik
      initialValues = {{ 
        bio: props.bio,
        image: null
    }}

    validate = {values => {
        const errors = {}

        if (!values.bio && !values.image) {
          errors.bio = "Change one of the fields to update"
        }

        setConfirm("")

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
      <Form onSubmit={handleSubmit} className={classes.root} noValidate autoComplete="off" >
      <br />
      <TextField
          label="Bio"
          name="bio"
          defaultValue={props.bio}
          multiline
          className={classes.root}
          rows={8}
          variant="outlined"
          onChange={handleChange}
        />

        
      <div style={{marginLeft: 10}}>
        <Input id="image" name="image" type="file"
          onChange={(event) => {
            setFieldValue("image", event.target.files[0]);
          }} />


      </div>
      <Typography className={classes.error}> {errors.bio} </Typography>
      <Typography className={classes.confirm}> {confirm} </Typography>
      <CircularProgress color="secondary" variant="determinate" value={progress} />
      <br />

      <Button type="submit" color="secondary" variant="outlined" disabled={isSubmitting}> Update </Button>
      <br />
      <br />

      </Form>

      )}
    </Formik>
  </div>
)

}



export default EditProfile