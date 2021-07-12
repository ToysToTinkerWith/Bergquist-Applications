import React from 'react';

import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/auth"

import { Formik, Field, Form } from 'formik';
import { Button, Box, TextField, makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  
  root: {
    width: "80%",
    margin: 15
  }

}))
 
function SignUp(props) {

  const classes = useStyles()

  const signUp = (formData) => {

    console.log(formData)

  firebase.auth().createUserWithEmailAndPassword(formData.email, formData.password)
  .then((authUser) => {

    firebase.firestore().collection("profiles").add({
          username: formData.displayName,
          imageUrl: null,
          uid: authUser.user.uid,
        })

  return authUser.user.updateProfile({
      displayName: formData.displayName
    })

    

  })
  .catch((error) => alert(error.message))

  props.setPage("")
    
}

  const signupstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    paddingLeft: "10px",
    paddingRight: "10px",
    marginLeft: "10px",
    marginRight: "10px"
}

  return (
    <div style={signupstyle}>
    <Formik
      initialValues = {{ 
        displayName: "", 
        email: "", 
        password: "",
        confPassword: ""
    }}

      validate = {values => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Required';
        } 
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
          errors.email = 'Invalid email address';
        }

        if (!values.displayName) {
          errors.displayName = "Required"
        }
        else if (values.displayName.length > 15) {
          errors.displayName = "Display name cannot be longer than 15 characters"
        }

        if (!values.password) {
          errors.password = "Required"
        }
        else if (values.password.length < 6) {
          errors.password = "Password must be at least 6 characters long"
        }

        if (!values.confPassword) {
          errors.confPassword = "Required"
        }
        else if (values.password !== values.confPassword) {
          errors.confPassword = "Passwords must match"
        }

        return errors
      }}

      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          signUp(values)
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
        /* and other goodies */
      }) => (
      <Form onSubmit={handleSubmit} autoComplete="off">
      <br />
          <TextField
            className={classes.root}
            type="text"
            label="Display Name"
            name="displayName"
            onChange={handleChange}
          />
          <TextField
            className={classes.root}
            type="email"
            label="Email"
            name="email"
            onChange={handleChange}
          />
          <TextField
            className={classes.root}
            type="password"
            label="Password"
            name="password"
            onChange={handleChange}
          />
          <TextField
            className={classes.root}
            type="password"
            label="Confirm Password"
            name="confPassword"
            onChange={handleChange}
          />
        <br />
        <br />
        <Button type="submit" color="secondary" variant="outlined" disabled={isSubmitting}> Sign Up </Button>
        <br />
        <br />
      </Form>
      )}
    </Formik>
  </div>
);

}



export default SignUp