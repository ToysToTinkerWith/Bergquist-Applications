
import Nav from "./Nav"
import { Card, Grid, Typography, Avatar } from "@material-ui/core"


export default function Me(props) {

    return (
        <Card style={{backgroundColor: "#212121", display: "grid"}}>
            <Grid container justifyContent="center">
                <Grid item xs={12} sm={12} md={6}>
                    <Typography 
                    variant="h2" 
                    align="center"
                    color="primary"
                    style={{
                        marginTop: "2%",
                    }}
                    > 
                    Bergquist
                    </Typography>
                    <Typography 
                    variant="h5" 
                    align="center"
                    color="primary"
                    > 
                    Business Applications
                    </Typography>
                    <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        margin: "2%",
                    }}>
                        <img 
                        src="React.svg"
                        style={{
                            margin: "2%",
                            width: 100
                        }}
                        />
                        <img 
                        src="MaterialUI.svg"
                        style={{
                            margin: "2%",
                            width: 80
                        }}
                        />
                        <img 
                        src="Firebase.svg"
                        style={{
                            margin: "2%",
                            width: 60
                        }}
                        />
                        <img 
                        src="Stripe.png"
                        style={{
                            margin: "2%",
                            width: 75
                        }}
                        />
                    </div>
                    
                </Grid>
                <Grid item xs={12} sm={12} md={6} style={{display: "flex", justifyContent: "center", alignItems: "flex-end"}}>
                        <Avatar 
                        src="self.jpg" 
                        style={{
                            width: 100,
                            height: 100,
                            display: "inline-flex",
                            margin: "4%"
                        }}/>
                        <Avatar 
                        src="self5.jpg" 
                        style={{
                            width: 200,
                            height: 200,
                            display: "inline-flex",
                            marginTop: "4%",
                            marginBottom: "4%"
                        }}/>
                        <Avatar 
                        src="self3.jpg" 
                        style={{
                            width: 100,
                            height: 100,
                            display: "inline-flex",
                            margin: "4%"
                        }}/>
                
                </Grid>
            </Grid>
            <Nav page={props.page} setPage={props.setPage}/>
        </Card>
    )
}