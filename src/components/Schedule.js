import React, { useEffect, useState } from 'react';

import { db } from "../../Firebase/FirebaseInit"
import { collection, getDocs } from "firebase/firestore"

import Client from "./Client/Client"

import { ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    DateNavigator,
    Appointments,
    Toolbar,
    ViewSwitcher,
    MonthView,
    WeekView,
    DayView,
} from '@devexpress/dx-react-scheduler-material-ui';

import { Modal, Button, Typography, Card } from '@material-ui/core'



export default class Schedule extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          events: [],
          client: null
        };
    
      }

    


    async componentDidMount() {

      const clientsRef = collection(db, "clients")

        const clientQuery = await getDocs(clientsRef)
        clientQuery.forEach( async (client) => {

            let jobsRef = collection(db, "clients", client.id, "jobs")

            let jobsQuery = await getDocs(jobsRef)
            jobsQuery.forEach((job) => {

              const jobDateFrom = new Date(job.data().scheduledFrom)
                const jobDateTo = new Date(job.data().scheduledTo)
                let color

                  if (this.props.date > jobDateTo) {
                    color = "#4caf50"
                  }

                  else if (this.props.date > jobDateFrom.setHours(0)) {
                    color = "#fdd835"
                  }

                  else {
                    color = "#2196f3"
                  }

                this.setState(oldState => ({
                    events: [...oldState.events, 
                        { 
                            startDate: job.data().scheduledFrom,
                            endDate: job.data().scheduledTo,
                            title: job.data().job,
                            color: color,
                            client: client.id
                        }]
                   
                  }))

            })

        })

    }
      

      render() {
        const uploadstyle = {
            backgroundColor: "#3F3D56",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            padding: 10,
            marginBottom: 40
         
          }
            
          

          const Appointment = ({
            data, children, style, ...restProps
          }) => (

            <Appointments.Appointment
              {...restProps}
              style={{
                ...style,
                backgroundColor: data.color,
                borderRadius: '8px',
              }}
              onClick={() => {
                  this.setState({
                      client: data.client
                  })
              }}
            >
              {children}
            </Appointments.Appointment>
          );

          
        return (
        <div style={uploadstyle}>
        <br />
        <Typography variant="h4" align="left" color="secondary" style={{fontFamily: "MoonBold", color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Schedules </Typography>
        <Typography variant="body1" style={{fontFamily: "MoonBold", color: "#E6E6E6", padding: 20}}> 
          See what specific jobs are happening on each day. Mark down important events happening within the company that have clickable views, and customizable actions. 
          Let clients and employees work their schedule around the company.
        </Typography>
          <Scheduler
              adaptivityEnabled={true}
              data={this.state.events}
            >
           
    
            <ViewState
                defaultCurrentDate={new Date()}
                currentViewName={"work-week"}
    
            />
    
    
            <WeekView
                name="work-week"
                displayName="Work Week"
                //excludedDays={[0, 6]}
                startDayHour={10}
                endDayHour={17}
            />
            
           
    
            
    
            <Toolbar />
    
            <DateNavigator />
            <Appointments 
            appointmentComponent={Appointment}/>
        </Scheduler>

        {this.state.client ?
        <Modal 
        open={true} 
        onClose={() => this.setState({client: null})}
        style={{
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <div>
            <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({client: null})}> Back </Button>
            <Client products={this.props.products} checkout={this.props.checkout} date={this.props.date} clientId={this.state.client}/>
          </div>
          
        </Modal>
        
        :
        null
        }
        </div>
        )
      }

      

}