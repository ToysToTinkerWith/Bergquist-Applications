import React, {useEffect, useState} from "react";

import firebase from "firebase/app"
import FirebaseInit from "../../components/Firebase/FirebaseInit";

import Job from "../../components/Client/Job"
import NewJob from "../../components/Client/NewJob"

import { Button, Typography, Modal } from "@material-ui/core"

export const getStaticPaths = async () => {
    // Return a list of possible value for id
    FirebaseInit()
    const paths = await firebase.firestore().collection("clients").get()
    .then((query) => {
            const paths = query.docs.map((doc) => {
            console.log(doc)
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

  
export default function Client({clientId}) {

    const [client, setClient] = useState(null)
    const [jobIds, setJobIds] = useState([])
    const [page, setPage] = useState(null)

    const date = new Date()



    useEffect(() => {
        firebase.firestore().collection("clients").doc(clientId).onSnapshot(doc => {
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
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            padding: "10px",
            margin: "10px"
        }

        return (
          <div style={clientStyle}>
            <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => 
            setPage("newJob")}>+ Job </Button>
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
              return [<Job key={index} date={date} clientId={clientId} jobId={jobId} />,
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
