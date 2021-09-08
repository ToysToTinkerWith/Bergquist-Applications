import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import { Typography, TextField, Button, IconButton, Avatar, Modal } from "@material-ui/core"

import DeleteIcon from '@material-ui/icons/Delete';
import ImageSearchIcon from '@material-ui/icons/ImageSearch';
import { checkout } from "../../pages/client/[id]";
import { isThisTypeNode } from "typescript";

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
      progress: 0,
      error: "",
      img: null,
    }
    this.handleChange = this.handleChange.bind(this)
    this.handlePicture = this.handlePicture.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.deleteImg = this.deleteImg.bind(this)


  }


  componentDidMount() {

    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId).onSnapshot(doc => {
      
      let color = ""
      let status = ""
      const jobDateFrom = new Date(doc.data().scheduledFrom)
      const jobDateTo = new Date(doc.data().scheduledTo)


      if (this.props.date > jobDateTo) {
        color = "#c8e6c9" //green
        if (doc.data().status !== "Paid") {
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
        job: doc.data(),
        color: color,
        status: status,
      })
    })

    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId)
    .collection("messages").orderBy("created").onSnapshot(snapshot => {
      this.setState({
        messages: []
      })

      let newMessages = []
      snapshot.forEach(message => {
        newMessages.push(message.data())
      })

      this.setState({
        messages: newMessages
      })
    })

  }

  sendMessage() {

    if (this.state.pictures.length == 0 && this.state.message == "") {
      this.setState({
        error: "Must send at least a message or a picture"
      })
    }

    else {
      firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId)
    .collection("messages").add({
      sender: this.props.client.name,
      message: this.state.message,
      imgs: [],
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then((doc) => {

        let uploadPictures = this.state.pictures
    
        for (let y = 0; y < uploadPictures.length; y++) {

        const uploadTask = firebase.storage().ref("images/" + this.props.clientId + "/" + uploadPictures[y].id).put(uploadPictures[y])

        uploadTask.on("state_changed", (snapshot) => {
          
        },
        (error) => {
          alert(error.message)
        },
        () => {

          firebase.storage().ref("images/" + this.props.clientId).child(uploadPictures[y].id).getDownloadURL()
      .then(url => {
        console.log(url)
            firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId)
            .collection("messages").doc(doc.id).update({
              imgs: firebase.firestore.FieldValue.arrayUnion(url)
            })
        })

        })

      }

      this.setState({
        message: "",
        pictures: [],
        error: ""
      })

      })
    }
    
  }

  handlePicture = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const newImage = e.target.files[i];
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
          <Typography variant="h5" color="secondary" style={{ display: "inline"}}> {this.state.job.job} </Typography>
          <Typography variant="subtitle1" color="secondary"> {this.state.job.details} </Typography>
          <Typography variant="h6" color="secondary"> <b>Start: </b>{new Date(this.state.job.scheduledFrom).toLocaleString()} </Typography>
          <Typography variant="h6" color="secondary"> <b>Finish: </b>{new Date(this.state.job.scheduledTo).toLocaleString()} </Typography>

          {this.state.status == "Completed" ? 
          <Typography variant="h6" color="secondary"> ${this.state.job.estimate} </Typography>
          :
          <Typography variant="h6" color="secondary"> Estimate: ${this.state.job.estimate} </Typography>
          }

          
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
            variant="outlined"
            value={this.state.message}
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
                <div key={index} style={{display: "inline-block", border: "1px solid black", borderRadius: 5, margin: 5, padding: 5}}>
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
            margin: 75,
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <EditJob setEdit={() => this.setState({edit: false})} setPage={this.props.setPage} clientId={this.props.clientId} job={this.state.job} jobId={this.props.jobId} />
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