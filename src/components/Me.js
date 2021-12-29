
import Nav from "./Nav"
import { Card, Grid, Typography, Avatar } from "@material-ui/core"


export default function Me(props) {

    return (
        <Card style={{backgroundColor: ""}}>
                    
                    
                    <Grid container>
                        <Grid item xs={12} sm={12} md={8} >
                            <Typography 
                                variant="h2" 
                                align="center"
                                style={{
                                    margin: "5%",
                                    color: "#E6E6E6",
                                }}
                                > 
                                Bergquist Applications
                                </Typography>
                                <Typography 
                                variant="h5" 
                                align="center"
                                style={{
                                    margin: "5%",
                                    color: "#E6E6E6"
                                }}
                                > 
                                Progressive Web Development
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} md={4}>
                                <Grid container>
                                    <Grid item xs={12} sm={6} md={12} lg={12} style={{padding: "5%"}}>
                                        <Typography 
                                        variant="h6" 
                                        align="center"
                                        style={{
                                            color: "#E6E6E6"
                                        }}
                                        > 
                                        360-969-9115
                                        </Typography>
                                        <img src="/Phone.svg" style={{display: "flex", margin: "auto", height: 50}}/>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={12} lg={12} style={{padding: "5%"}}>
                                        <Typography 
                                        variant="h6" 
                                        align="center"
                                        style={{
                                            color: "#E6E6E6"
                                        }}
                                        > 
                                        abergquist96@gmail.com
                                        </Typography>
                                        <img src="/Email.svg" style={{display: "flex", margin: "auto", height: 50}}/>
                                    </Grid>
                                </Grid>
                                    
                                    
                            
                            
                            
                        </Grid>
                    </Grid>
                    <br />
                    
                    
                
            <Nav page={props.page} setPage={props.setPage}/>
        </Card>
    )
}