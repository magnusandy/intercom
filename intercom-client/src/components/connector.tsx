import React, { ReactNode } from "react";
import { Optional } from "java8script";
import App from "../App";
import { loadConfig } from "../socket/config";
import ConnectionPage from "./connectionPage";

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

    onSubmit = (n: string) => {
        this.setState({
            name: Optional.of(n),
            connected: true,
        })
    }

    renderUnconnected = () => (
            <ConnectionPage onComplete={this.onSubmit} />
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