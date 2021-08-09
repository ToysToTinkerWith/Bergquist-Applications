import React, { useEffect, useState } from 'react';

import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"



import ViewProduct from "../Product/ViewProduct"

import { Button, Typography, Modal, TextField, CircularProgress, makeStyles } from '@material-ui/core'
import { Card, CardActionArea, CardActions, CardContent, CardMedia } from '@material-ui/core'

 
function NewJob(props) {

  const [viewProduct, setViewProduct] = useState(null)

  const uploadstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    textAlign: "center"
 
  }

  return (

    <div style={uploadstyle}>

      {viewProduct ? 
      <Modal 
      open={true} 
      onClose={() => setViewProduct(null)}
      style={{
        marginTop: 75,
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        <ViewProduct product={viewProduct} clientId={props.clientId} closeModal={props.closeModal}/>
      </Modal>
      :
      null
      }

      {props.products.length > 0 ?
        props.products.map(product => {
          if (product.product.active) {
            return (

              <Card style={{width: "150", display: "inline-block", margin: 15, border: "1px solid black"}}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  alt={product.product.name}
                  height="140"
                  image={product.product.images[0]}
                  title={product.product.name}
                />
                <CardContent>
                  <Typography color="secondary" gutterBottom variant="h5" component="h2">
                    {product.product.name} 
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardActions>
                <Button 
                size="small"
                color="secondary" 
                variant="contained"
                style={{display: "flex", margin: "auto"}}
                onClick={() => {setViewProduct(product)}}
                >
                  Details
                </Button>
                
              </CardActions>
            </Card>
            )
          }
          
          
        })
        :
        null
        }
    
  </div>
)

}



export default NewJob