
import React from "react"

import Head from "next/head"
import { Typography, Card } from "@mui/material"



import Clients from "../components/Client/Clients"
import Map from "../components/Map/Map"
import Schedule from "../components/Schedule"
import BarGraph from "../components/Charts/BarGraph"


import getStripe from '../../lib/get-stripe';
import Stripe from "stripe";


export default class Components extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
        
    }
    this.redirectToCheckout = this.redirectToCheckout.bind(this)
}

  redirectToCheckout = async (job, jobId, clientId) => {
    // Create Stripe checkout
    const response = await fetch('/api/checkout-sessions', {
      method: "POST",
      body: JSON.stringify({
        success_url: window.location.href,
        cancel_url: window.location.href,
        line_items: [{
              price_data: {
                  currency: "usd",
                  product_data: {
                      name: job.job,
                      tax_code: 'txcd_10000000'
                  },
                  unit_amount: job.estimate * 100,
                  tax_behavior: "exclusive",
              },
              quantity: 1,
              
        }],
        payment_method_types: ["card"],
        mode: "payment",
        metadata: {
          jobId: jobId,
          clientId: clientId
        }
      }),
      headers: {
        "Content-Type": "application/json",
      }
        
    });
  
    const session = await response.json()
    console.log(session)
  
  
  
    // Redirect to checkout
    const stripe = await getStripe();
    await stripe.redirectToCheckout({ sessionId: session.id });
  };

  render() {

    const date = new Date()

    return (
        
      <div style={{padding: 20}}>
          <Head>
              <title>Components</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="description" content="See data visualization components you can use, to display data in all shapes and forms. Think about ways in which custom data collection and display, can enhance the way users interact with your application." />
              <meta name="keywords" content="Custom Data Collection, Custom Data Display, Charts, Data Grids, Maps, Schedules" />
              
              <meta property="og:url" content="https://andersbergquist.com/components" key="ogcomponentsurl" />
              <meta property="og:title" content="Components" key="ogcomponents" />
              <meta property="og:description" content="See data visualization components you can use, to display data in all shapes and forms. Think about ways in which custom data collection and display, can enhance the way users interact with your application." key="ogcomponentsdesc" />
              </Head>
          <Card style={{
              backgroundColor: "#3F3D56",
              borderRadius: "15px",
              boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
              padding: 10,
              marginBottom: 20
          }}
              >
                  <br />
                  <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Charts </Typography>
              <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
              Understand what is happening in the business at a moment's glance. Visualize important success factors to steer decision making in the right direction.
              Listen for real time updates in the database, and update the display when necessary.
              </Typography>
              <br />
          <BarGraph />
          </Card>

          
          <Clients checkout={this.redirectToCheckout} products={this.props.products} user={this.props.user} date={date} />

          <Card style={{
              backgroundColor: "#3F3D56",
              borderRadius: "15px",
              boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
              padding: 10,
              marginBottom: 20
          }}
              >
              <br />
              <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Maps </Typography>
              <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
              View client addresses and highlight customers that need service for the day. Display different business locations, and inform the community on what is happening at each site. 
              </Typography>
              <Map checkout={this.redirectToCheckout} products={this.props.products} date={date} />
          </Card>

              
          <Schedule checkout={this.redirectToCheckout} products={this.props.products} date={date} />

         


          

          
      </div>
      
  )
  }

    
}

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