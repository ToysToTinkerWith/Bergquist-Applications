import React, {useEffect, useState} from "react";

import firebase from "firebase/app"
import FirebaseInit from "../../components/Firebase/FirebaseInit";

import { loadStripe } from "@stripe/stripe-js";
import { createCheckoutSession } from "next-stripe/client";


import Job from "../../components/Client/Job"
import NewJob from "../../components/Client/NewJob"

import { Button, Typography, Modal } from "@material-ui/core"

export const getStaticPaths = async () => {
    // Return a list of possible value for id
    FirebaseInit()
    const paths = await firebase.firestore().collection("clients").get()
    .then((query) => {
            const paths = query.docs.map((doc) => {
            // doc.data() is never undefined for query doc snapshots
            return {params: { id: doc.id }} 
            });
    
            return paths
        
    })

    return {
        paths,
        fallback: false
      }

    
  }
  
export const getStaticProps = async (context) =>  {
    const id = context.params.id
        
return {
    props: {clientId: id}
}
}

export const checkout = async (job) => {
    const session = await createCheckoutSession({
      success_url: window.location.href,
      cancel_url: window.location.href,
      line_items: [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: job.job
                },
                unit_amount: job.estimate * 100,
            },
            quantity: 1,
      }],
      payment_method_types: ["card"],
      mode: "payment",
    });
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
    if (stripe) {
      stripe.redirectToCheckout({ sessionId: session.id })
      
    }
  };

  
export default function Client({clientId}) {

    const [client, setClient] = useState(null)
    const [jobIds, setJobIds] = useState([])
    const [page, setPage] = useState(null)

    const date = new Date()



    useEffect(() => {
        firebase.firestore().collection("clients").doc(clientId).get()
        .then((doc) => {
        let client = doc.data()

        firebase.firestore().collection("clients").doc(clientId).collection("jobs")
        .onSnapshot((querySnapshot) => {

        let jobIds = []

        querySnapshot.forEach(function(doc) {
            jobIds.push(doc.id)
        })

        setClient(client)
        setJobIds(jobIds)

        })
      })
    }, []);


    if (client) {

        const clientStyle = {
            backgroundColor: "#FFFFF0",
            padding: "10px",
        }

        return (
          <div style={clientStyle}>
              <div style={{display: "inline"}}>
              <Button variant="outlined" color="secondary" onClick={() => 
                window.location.href = "/"}> Map </Button>
                <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => 
                setPage("newJob")}>+ Job </Button>
              </div>
            
            
            
            <Typography variant="h4" color="secondary"> {client.name} </Typography>
            <Typography variant="h5" color="secondary"> {client.address} </Typography>
            <Typography variant="h5" color="secondary"> {client.email} </Typography>
            <Typography variant="h5" color="secondary"> {client.phone} </Typography>
            <br />

            {page === "newJob" ? 
            <Modal 
            open={true} 
            onClose={() => setPage(null)}
            style={{
              marginTop: 75,
              overflowY: "auto",
              overflowX: "hidden"
            }}>
            <NewJob clientId={clientId} goBack={() => setPage(null)} />
            </Modal>
            :
            null
            }
            
    
    
            {jobIds.length > 0 ? jobIds.map((jobId, index) => {
              return [<Job key={index} date={date} checkout={checkout} clientId={clientId} jobId={jobId} />,
              <br />]
              
            })
            :
            null}
    
            <br />
    
          </div>
        )
      }
    
      else {
        return (
          <div>
          </div>
        )
    }
  }
