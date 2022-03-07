import React, { useState } from 'react';

import { db } from "../../../Firebase/FirebaseInit"
import { doc, updateDoc } from "firebase/firestore"


import { Formik, Form } from 'formik';
import { Button, TextField, Grid, makeStyles } from '@material-ui/core'


const useStyles = makeStyles((theme) => ({

  input: {
    margin: theme.spacing(3),
    width: 300
  }
}))
 
function EditJob(props) {

  const classes = useStyles()

  const handleUpdate = async (formData) => {

    const jobRef = doc(db, "clients", props.clientId, "jobs", props.jobId)

    await updateDoc(jobRef, {
      scheduledFrom: formData.scheduledFrom,
      scheduledTo: formData.scheduledTo,
      estimate: formData.estimate
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
      
        
      <br/>

      <Grid container>
              <Grid item xs={12} sm={12} md={6}>
                <TextField 
                  name="scheduledFrom"
                  label="From"
                  type="datetime-local"
                  defaultValue={props.job.scheduledFrom}
                  className={classes.input}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField
                  name="scheduledTo"
                  label="To"
                  type="datetime-local"
                  defaultValue={props.job.scheduledTo}
                  className={classes.input}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
          </Grid>


          <TextField
          className={classes.input}
          onChange={handleChange}
          defaultValue={props.job.estimate}
          type="number"
          label="Estimate"
          name="estimate"
          />

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



export default EditJob