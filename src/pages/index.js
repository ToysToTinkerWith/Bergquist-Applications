import React, { useState } from "react";
import Head from 'next/head'
import { useAuth } from "../components/Firebase/FirebaseAuth"

import "firebase/firestore"

import Nav from "../components/Nav"
import Map from "../components/Map/Map"
import Auth from "../components/Auth/Auth"
import NewClient from "../components/Client/NewClient"
import Client from "../components/Client/Client"

import { Modal, Fab } from "@material-ui/core"


export default function Index() {

  const { user } = useAuth()

  const date = new Date()

  const [page, setPage] = useState("")
  const [client, setClient] = useState(null)


  return (
    <main>
    <Head>
      <title>Business</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>

    <Nav user={user} setPage={setPage} />

    <Map date={date} user={user} setPage={setPage} setClient={setClient} />

    

    {page === "Auth" ?
    <Modal 
    open={true} 
    onClose={() => setPage("")}
    style={{
      marginTop: 75,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
    <Auth setPage={setPage}/>
    </Modal>
    
    :
    null
    }

    {page === "NewClient" ?
    <Modal 
    open={true} 
    onClose={() => setPage("")}
    style={{
      marginTop: 75,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
    <NewClient user={user} setPage={setPage} />
    </Modal>
    
    :
    null
    }

    {page === "Client" ?
    <Modal 
    open={true} 
    onClose={() => setPage("")}
    style={{
      marginTop: 75,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
    <Client date={date} user={user} clientId={client} />
    </Modal>
    
    :
    null
    }

  </main>
  )
  }



