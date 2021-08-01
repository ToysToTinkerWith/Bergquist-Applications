import React, { useState } from "react";
import Head from 'next/head'
import { useAuth } from "../components/Firebase/FirebaseAuth"

import "firebase/firestore"

import Nav from "../components/Nav"
import Map from "../components/Map/Map"
import Auth from "../components/Auth/Auth"
import Client from "../components/Client/Client"
import Clients from "../components/Client/Clients"


import SignUp from "../components/Auth/SignUp"

import { Modal } from "@material-ui/core"


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
    
    
    {user ? 
    <div>
      <Nav user={user} setPage={setPage} />
      <Map date={date} user={user} setPage={setPage} setClient={setClient} />
    </div>
    
    
    :
    <Auth setPage={setPage}/>
    }


    {page === "Clients" ?
    <Modal 
    open={true} 
    onClose={() => setPage("")}
    style={{
      marginTop: 75,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
    <Clients user={user} date={date} setClient={setClient} setPage={setPage} />
    </Modal>
    
    :
    null
    }

    {page === "NewEmployee" ?
    <Modal 
    open={true} 
    onClose={() => setPage("")}
    style={{
      marginTop: 75,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
    <SignUp user={user} setPage={setPage} />
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



