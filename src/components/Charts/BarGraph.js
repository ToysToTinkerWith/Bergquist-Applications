import React from "react";

import firebase from "firebase/app"

import { BarChart, XAxis, YAxis, Bar, Tooltip, ResponsiveContainer} from "recharts"

import { Typography } from "@material-ui/core"

export default class BarGraph extends React.Component {

    constructor() {
        super()
        this.state = {
            clients: [],
            clientIds: []
        }
      }

    componentDidMount() {
    firebase.firestore().collection("clients").onSnapshot(snapshot => {

        snapshot.forEach(doc => {

            let clientData = doc.data()
            let clientId = doc.id

            firebase.firestore().collection("clients").doc(clientId).collection("jobs").get().then(query => {
                let jobCount = 0
                let paidJobs = 0
                query.forEach(job => {

                    jobCount += 1
                    if (job.data().status == "Paid") {
                        paidJobs += 1
                    }
                })
                clientData.jobCount = jobCount
                clientData.paidJobs = paidJobs
                this.setState(prevState => ({
                    clients: [...prevState.clients, clientData],
                    clientIds: [...prevState.clientIds, clientId]
                }))
            })
        
        })

    })

    }


    render() {
        return (
            <ResponsiveContainer width="95%" height={250}>
            <BarChart data={this.state.clients}>
            <XAxis 
            dataKey="name" 
            stroke="#E6E6E6"
            />
            <YAxis 
            dataKey="jobCount" 
            stroke="#E6E6E6"
            />
            <Tooltip />
            <Bar dataKey="jobCount" fill="#6474E4"/>
            <Bar dataKey="paidJobs" fill="#FF6584" />
            </BarChart>
            </ResponsiveContainer>
        )
    }
}