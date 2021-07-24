import React from "react";
import ReactDOM from "react-dom";
import { useServiceWorker, ServiceWorkerProvider } from "./lib";
import * as serviceWorker from "./serviceWorkerRegistration";


const Example: React.FC = () => {

    const object = useServiceWorker();

    return (
        <>
            {JSON.stringify(object)}
        </>
    );
};

ReactDOM.render((
    <ServiceWorkerProvider
        serviceWorker={serviceWorker}
        onAppInstalled={() => console.log('App Installed')}
        APPLICATION_SERVER_PUBLIC_KEY="YOUR_APP_PUBLIC_KEY"
        onUpdateNotificationSubscription={console.log}
    >
        <Example />
    </ServiceWorkerProvider>
), document.getElementById("root"));