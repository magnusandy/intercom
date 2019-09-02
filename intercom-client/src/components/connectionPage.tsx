import React, { ReactNode } from "react";
import { withStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Theme, Container, TextField, Button } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

interface Props {
    classes: any;
    onComplete: (name: string) => void;
}

interface State {
    nameField: string;
}


const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        height: "100%"

    },
    paper: {
        padding: 16,
        textAlign: 'center' as "center",
        color: "dark-grey",
    },
    button: {

    }
});

class ConnectionPage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            nameField: ""
        };
    }

    onConnectPress = () => {
        const { nameField } = this.state;
        if (nameField !== "") {
            this.props.onComplete(nameField);
        }
    }

    render(): ReactNode {
        const { classes } = this.props;
        return (<Container className={classes.root}
            maxWidth="sm"
        >
            <Paper className={classes.paper}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h2" >
                            Party House Intercom
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="standard-name"
                            label="Room Name"
                            placeholder="Kitchen"
                            value={this.state.nameField}
                            onChange={(n) => this.setState({ nameField: n.target.value })}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item container justify="center" xs={6}>
                        <Button
                            onClick={this.onConnectPress}
                            variant="contained"
                            className={classes.button}
                            size={"large"}
                        >
                            Connect
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

        </Container>);
    }
}

export default withStyles(styles)(ConnectionPage);