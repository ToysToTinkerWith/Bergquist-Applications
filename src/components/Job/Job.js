import React from "react"

import { db } from "../../../Firebase/FirebaseInit"
import { doc, collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore"

import { storage } from "../../../Firebase/FirebaseInit"
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { Typography, TextField, Button, IconButton, Avatar, Modal } from "@material-ui/core"

import EditJob from "./EditJob"

import ImageSearchIcon from '@material-ui/icons/ImageSearch';
import DeleteIcon from '@material-ui/icons/Delete';


class Job extends React.Component {

  constructor() {
    super()
    this.state = {
      job: null,
      color: null,
      status: null,
      messages: [],
      message: "",
      pictures: [],
      img: null,
      error: "",
      edit: false
    }
    this.handleChange = this.handleChange.bind(this)
    this.handlePicture = this.handlePicture.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.deleteImg = this.deleteImg.bind(this)


  }


  componentDidMount() {

    const jobRef = doc(db, "clients", this.props.clientId, "jobs", this.props.jobId)

    this.unsubJob = onSnapshot(jobRef, (job) => {

      this.setState({ job: null })

      let color = ""
      let status = ""
      const jobDateFrom = new Date(job.data().scheduledFrom)
      const jobDateTo = new Date(job.data().scheduledTo)

      if (this.props.date > jobDateTo) {
        color = "#c8e6c9" //green
        if (job.data().status !== "Paid") {
            status = "Completed"
        }
        else {
          status = "Paid"
        }
        
      }

      else if (this.props.date > jobDateFrom.setHours(0)) {
        
        color = "#fff9c4" //yellow
        status = "Scheduled today"
    
      }
      
      else {
        color = "#bbdefb" //blue
        status = "On Schedule"
      }
      
      this.setState({
        job: job.data(),
        color: color,
        status: status
      })
    })

    const messagesRef = collection(db, "clients", this.props.clientId, "jobs", this.props.jobId, "messages")

    const messageQuery = query(messagesRef, orderBy("created", "desc"))

    this.unsubMessages = onSnapshot(messageQuery, (messageSnapshot) => {
      this.setState({
        messages: []
      })

      let newMessages = []
      messageSnapshot.forEach(message => {
        newMessages.push(message.data())
      })

      this.setState({
        messages: newMessages
      })
      
    })

  }

  async sendMessage() {

    if (this.state.pictures.length == 0 && this.state.message == "") {
      this.setState({
        error: "Must send at least a message or a picture"
      })
    }

    else {

      const messageRef = collection(db, "clients", this.props.clientId, "jobs", this.props.jobId, "messages")

      await addDoc(messageRef, {
        sender: "Company",
        message: this.state.message,
        imgs: [],
        created: serverTimestamp()
      }).then(doc => {

        const uploadPictures = this.state.pictures

            for (let y = 0; y < uploadPictures.length; y++) {

            const imgRef = ref(storage, "messageImages/" + this.props.clientId + "/" + uploadPictures[y].id)
    
            uploadBytes(imgRef, uploadPictures[y])

            const uploadTask = uploadBytesResumable(imgRef, uploadPictures[y])
    
            uploadTask.on("state_changed", (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            },
            (error) => {
            alert(error.message)
            },
            () => {

            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                
                updateDoc(doc, {
                  imgs: arrayUnion(downloadURL)
                })
            });
    
            })
    
        }
    
        })

        this.setState({
          message: "",
          pictures: [],
          error: ""
        })
      }

    
  }

  handlePicture = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const newImage = e.target.files[i];
      console.log(newImage)
      newImage["id"] = Math.random().toString(20);
      this.setState(prevState => (({pictures: [...prevState.pictures, newImage]})))
    }
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
    [name]: value
    });
  }

  deleteImg(index) {

    const imgs = this.state.pictures

    imgs.splice(index, 1)

    this.setState({
      pictures: imgs
    })

  }


  render() {

    if (this.state.job) {

      const jobstyle = {
        backgroundColor: this.state.color,
        borderRadius: "15px",
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        padding: "10px",
        marginBottom: 10
        }

      return (
        <div style={jobstyle}>
          <Button style={{float: "right"}} variant="contained" color="secondary" onClick={() => this.setState({edit: !this.state.edit})}>Edit</Button>
          <Typography variant="h5" color="secondary" style={{ display: "inline"}}> {this.state.job.job} </Typography>
          <Typography variant="subtitle1" color="secondary"> {this.state.job.details} </Typography>
          <Typography variant="h6" color="secondary"> <b>Start: </b>{new Date(this.state.job.scheduledFrom).toLocaleString()} </Typography>
          <Typography variant="h6" color="secondary"> <b>Finish: </b>{new Date(this.state.job.scheduledTo).toLocaleString()} </Typography>

          <Typography variant="h6" color="secondary"> {"Estimate: $" + Number(this.state.job.estimate).toFixed(2).toString()} </Typography>
          <Typography variant="h6" color="secondary"> Status: <b>{this.state.status}</b> </Typography>

          {this.state.status == "Completed" ?
          <Button 
          variant="contained" 
          color="secondary"
          onClick={() => {
            this.props.checkout(this.state.job, this.props.jobId, this.props.clientId)
          }}
          >
            Pay
          </Button>
          :
          null
          }

          {this.state.messages.length > 0 ? this.state.messages.map(message => {

            return (
            <div style={{border: "1px solid grey", borderRadius: 10, padding: 10, margin: 10}}>
            <Typography variant="body1" color="secondary"> {message.sender} </Typography>
            <Typography variant="body1" color="secondary"> {message.message} </Typography>
            {message.imgs.length > 0 ? message.imgs.map(image => {
              return [
              <IconButton onClick={() => this.setState({img: image})} >
              <Avatar src={image} alt="" style={{ height: '100px', width: '100px' }} />
              </IconButton>
              ]
            })
            :
            null
            }
            
            </div>
            )
            
          })
          :
          null
          }
          <br />

          <Button variant="contained" color="secondary" component="label" style={{display: "inline-flex", width: '10%', left: "75%"}}>
            <ImageSearchIcon/>
          <input type="file" multiple onChange={this.handlePicture} style={{width: 1, opacity: 0}}/>
          </Button>

          <TextField
            color="secondary"
            onChange={this.handleChange}
            multiline
            rows={3}
            value={this.state.message}
            variant="outlined"
            type="text"
            label="Message"
            name="message"
            style={{
              display: "flex",
              margin: "auto",
              width: "70%"
            }}
          />
          <br />
          <div style={{textAlign: "center"}}>
            {this.state.pictures.length > 0 ? this.state.pictures.map((picture, index) => {
              console.log(picture)
              return (
                <div style={{display: "inline-block", border: "1px solid black", borderRadius: 5, margin: 5, padding: 5}}>
                  <Avatar src={URL.createObjectURL(picture)} alt="img" style={{height: 75, width: 75}}/>
                  <IconButton onClick={() => this.deleteImg(index)}>
                    <DeleteIcon />
                  </IconButton>   
                </div>
              )
            })  
            :
            null
            }
          </div>

          <Typography variant="body1" color="secondary" align="center" style={{color: "#d32f2f", marginBottom: 10}}> {this.state.error} </Typography>

          

          <Button 
          variant="contained" 
          color="secondary"
          style={{
            display: "flex",
            margin: "auto"
          }}
          onClick={() => {
            this.sendMessage()
          }}
          >
            Send
          </Button>
          
          
          {this.state.edit ? 
          <Modal 
          open={true} 
          onClose={() => this.setState({edit: false})}
          style={{
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <div>
            <Button variant="contained" color="secondary" style={{width: "100%"}} onClick={() => this.setState({edit: false})}> Back </Button>
            <EditJob setEdit={() => this.setState({edit: false})} setPage={this.props.setPage} clientId={this.props.clientId} job={this.state.job} jobId={this.props.jobId} />
          </div>
          
          </Modal>
          :
          null
          }

          {this.state.img ?
          <Modal 
          open={true} 
          onClose={() => this.setState({img: null})}
          style={{
            margin: 100,
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <Avatar src={this.state.img} alt="" variant="square" style={{ width: "100%", height: "auto" }} />
          </Modal>
          
          :
          null
          }

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
    

export default Job