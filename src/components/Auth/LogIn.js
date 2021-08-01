import React from 'react';

import firebase from "firebase/app"
import "firebase/auth"

import { Formik, Form } from 'formik';
import { Button, Typography, TextField, makeStyles } from '@material-ui/core'


const useStyles = makeStyles((theme) => ({
  
  root: {
    width: "80%",
    margin: 15
  },
  error: {
    color: "red"
  }

}))

 
function LogIn(props) {

  const classes = useStyles()


  const logIn = (formData) => {

    console.log(formData)

    firebase.auth().signInWithEmailAndPassword(formData.email, formData.password)
    .then(props.setPage("Map"))
    .catch((error) => alert(error.message))
    
}

  const signupstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    padding: 10,
    margin: 10
  }

  return (

    <div style={signupstyle}>
    <Formik
      initialValues = {{ 
        email: "", 
        password: ""
    }}

      validate = {values => {
        const errors = {};
        if (!values.email || !values.password) {
          errors.email = 'Incomplete Form'
        } 


        return errors
      }}
      

      onSubmit = {(values, { setSubmitting }) => {
        setTimeout(() => {
          logIn(values)
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
      
      <Form onSubmit={handleSubmit}>
      <br/>
          <TextField
            className={classes.root}
            type="email"
            label="Email"
            name="email"
            onChange={handleChange}
          />
          <br />
          <TextField
            className={classes.root}
            type="password"
            label="Password"
            name="password"
            onChange={handleChange}
          />
        <br />
        <Typography className={classes.error}> {errors.email} </Typography>
        <br />
        <Button type="submit" color="secondary" variant="outlined" disabled={isSubmitting}> Log In </Button>
        <br />
        <br />
      </Form>
      )}
    </Formik>
  </div>
);

}



export default LogIn