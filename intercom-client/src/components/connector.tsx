import React, { ReactNode } from "react";
import { Optional } from "java8script";
import App from "../App";
import { loadConfig } from "../socket/config";

interface Props { }
interface State {
    name: Optional<string>,
    connected: boolean,
}
export default class Connector extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            name: Optional.empty(),
            connected: false,
        }
    }

    onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            name: Optional.ofNullable(event.target.value),
        })
    }

    onSubmit = () => {
        this.state.name.ifPresent( n => 
            this.setState({ connected: true })
        );
    }

    renderUnconnected = () => (
        <div>
            <h1>Enter your rooms name. i.e. (kitchen, basement)</h1>
            <input type="text" value={this.state.name.orElse("")} onChange={this.onInputChanged} />
            <button onClick={this.onSubmit}>Connect</button>
        </div>
    )

    renderConnected = () => (
        <App    
            roomName={this.state.name.orElseThrow(() => new Error("No Room Name Supplied"))}
            config={loadConfig()}
        />
    )


    render = (): ReactNode => {
        return (
            this.state.connected 
                ? this.renderConnected() 
                : this.renderUnconnected()
        );
    }
}