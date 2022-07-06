import React from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { doc, collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"

import News from "./News"
import Governance from "./Governance"
import Admin from "./Admin"

import { Button, Typography, Modal, Grid } from "@mui/material"


export default class Dashboard extends React.Component {

    constructor() {
        super()
        this.state = {
            wallet: null,
            page: "news"
        }
   
    }


  componentDidMount() {

    const walletRef = doc(db, "wallets", this.props.walletId)

    this.unsub = onSnapshot(walletRef, (wallet) => {
        this.setState({
          wallet: wallet.data()
        })
    })

  }

  componentWillUnmount() {
    this.unsub()
  }

 

  render() {

    if (this.state.wallet) {


        return (
          <div>
              <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: 40}}> 
               Moon Holders
              </Typography>
            <div style={{backgroundImage: "url('Space.svg')", backgroundSize: "100%"}}>

              <Grid container>
                <Grid item xs={12} sm={6} md={4}>
                  <Button onClick={() => this.setState({page: "news"})} style={{display: "grid", margin: "auto"}}>
                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: this.state.page == "news" ? "#6C63FF" : "#E6E6E6", padding: 40}}> 
                        News
                    </Typography>
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button onClick={() => this.setState({page: "governance"})} style={{display: "grid", margin: "auto"}}>
                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: this.state.page == "governance" ? "#6C63FF" : "#E6E6E6", padding: 40}}> 
                        Governance
                    </Typography>
                  </Button>
                </Grid>
                {this.props.walletId == "OMHDKCZHDVZWF5WDEUV3T5JVH6UXG2THD26GT62M2VZOWVYN24YAONWUAE" ?
                  <Grid item xs={12} sm={6} md={4}>
                    <Button onClick={() => this.setState({page: "admin"})} style={{display: "grid", margin: "auto"}}>
                      <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: this.state.page == "admin" ? "#6C63FF" : "#E6E6E6", padding: 40}}> 
                          Admin
                      </Typography>
                    </Button>
                  </Grid>
                  :
                  null
                }
                
              </Grid>
            </div>

            {this.state.page == "news" ?
              <News />
              :
              null
            }

            {this.state.page == "governance" ?
              <Governance wallet={this.state.wallet} walletId={this.props.walletId} addresses={this.props.addresses} />
              :
              null
            }

            {this.state.page == "admin" ?
              <Admin  />
              :
              null
            }

            <br />
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
  

      
  }
    
