import React, { useState } from "react";
import Head from 'next/head'
import { useAuth } from "../components/Firebase/FirebaseAuth"

import "firebase/firestore"

import Nav from "../components/Nav"
import About from "../components/About"
import Components from "../components/Components"
import Process from "../components/Process"


import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";
import { createCheckoutSession } from "next-stripe/client";

export const getStaticProps = async () =>  {

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2020-08-27",
  });

  const prices = await stripe.prices.list({
    active: true,
    limit: 10,
    expand: ["data.product"],
  });
      
return { props: {products: prices.data.reverse()}}
}

export const checkout = async (job, jobId, clientId) => {
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
    metadata: {
      jobId: jobId,
      clientId: clientId
    }
  });
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
  if (stripe) {
    stripe.redirectToCheckout({ sessionId: session.id })
    
  }
};


export default function Index({products}) {

  const { user } = useAuth()

  const date = new Date()

  const [page, setPage] = useState("About")

  console.log(date)


  return (
    <main>
    <Head>
      <title>Bergquist Applications</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      
    </Head>

    <Nav page={page} setPage={setPage}/>

    {page === "About" ?
    <About setPage={setPage} />
    :
    null
    }

    {page === "Components" ?
    <Components products={products} checkout={checkout} user={user} date={date} />
    :
    null
    }

    {page === "Process" ?
    <Process />
    :
    null
    }

    

    

  </main>
  )
  }



