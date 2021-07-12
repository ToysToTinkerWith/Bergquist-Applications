import React from 'react';

import firebase from "firebase/app"
import "firebase/firestore"

import { Formik, Form } from 'formik';
import { Button, TextField, makeStyles } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  error: {
    color: "red"
  },
  input: {
    margin: theme.spacing(3),
    width: '70%'
  }
}))
 
function EditClient(props) {

  const classes = useStyles()

  const handleUpdate = (formData) => {

    firebase.firestore().collection("clients").doc(props.clientId).update({
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
    })

  }

  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    paddingLeft: "10px",
    paddingRight: "10px",
    textAlign: "center"

  }


  return (

    <div style={uploadstyle}>
    <Formik
      initialValues = {{ 
        name: props.client.name,
        address: props.client.address,
        phone: props.client.phone,
        email: props.client.email,

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
          props.goBack()

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
          defaultValue={props.client.name}
          type="text"
          label="Name"
          name="name"
        />

        <TextField
          className={classes.input}
          onChange={handleChange}
          defaultValue={props.client.address}
          type="text"
          label="Address"
          name="address"
        />

         <TextField
          className={classes.input}
          onChange={handleChange}
          defaultValue={props.client.email}
          type="text"
          label="Email"
          name="email"
        />

        <TextField
          className={classes.input}
          onChange={handleChange}
          defaultValue={props.client.phone}
          type="text"
          label="Phone"
          name="phone"
        />

       


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



export default EditClient