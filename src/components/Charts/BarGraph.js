import React from "react";

import { db } from "../../../Firebase/FirebaseInit"
import { collection, getDocs, onSnapshot } from "firebase/firestore"

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

        const clientRef = collection(db, "clients")

        this.unsub = onSnapshot(clientRef, (clientSnap) => {

            this.setState({
                clients: []
            })

            clientSnap.forEach(async (client) => {


                let clientData = client.data()
                clientData.id = client.id
                
                const jobsRef = await getDocs(collection(db, "clients", client.id, "jobs"))

                let jobCount = 0
                let paidJobs = 0

                jobsRef.forEach((job) => {


                    jobCount += 1
                    if (job.data().status == "Paid") {
                        paidJobs += 1
                    }
                })

                clientData.jobCount = jobCount
                clientData.paidJobs = paidJobs

                this.setState(prevState => ({
                    clients: [...prevState.clients, clientData]
                }))

            });


        });

    }

    componentWillUnmount() {
        this.unsub()
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