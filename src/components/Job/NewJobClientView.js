import React, { useState } from 'react';

import ViewProduct from "../Product/ViewProduct"

import { Button, Typography, Modal } from '@material-ui/core'
import { Card, CardActionArea, CardActions, CardContent, CardMedia } from '@material-ui/core'

 
function NewJobClientView(props) {

  const [viewProduct, setViewProduct] = useState(null)

  const uploadstyle = {
    backgroundColor: "#3F3D56",
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
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        <div>
          <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => setViewProduct(null)}> Back </Button>
          <ViewProduct date={props.date} product={viewProduct} client={props.client} clientId={props.clientId} closeModal={props.closeModal}/>
        </div>
        
      </Modal>
      :
      null
      }

      {props.products.length > 0 ?
        props.products.map(product => {
          if (product.product.active) {
            return (

              <Card style={{width: 300, height: 400, display: "inline-block", margin: 15}}>
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
                  <Button 
                  size="small"
                  color="secondary" 
                  variant="contained"
                  style={{display: "flex", margin: "auto"}}
                  onClick={() => {setViewProduct(product)}}
                  >
                    Schedule
                  </Button>
                  <Typography color="secondary" gutterBottom variant="body1" component="h2">
                    {product.product.description} 
                  </Typography>
                  
                </CardContent>
                
                
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



export default NewJobClientView